import json
import shutil
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import coat_dance_vace_worker as worker


class WindowPlanningTests(unittest.TestCase):
    def test_every_frame_once_with_no_gap_or_duplicate(self):
        for frames in [1, 4, 16, 57, 58, 64, 65, 66, 120, 384, 900]:
            spans = worker.windows(frames)
            kept = worker.accepted_frames(frames)
            sample = []
            for index, low, high in kept:
                start = spans[index][1]
                sample.extend(range(start + low, start + high))
            self.assertEqual(sample, list(range(frames)), f"frame count {frames}")

    def test_native_vace_video_control_not_image_to_video(self):
        graph = worker.graph(
            "control.mp4", 12345, "Hand-painted animation", "coatdance/pilot"
        )
        self.assertEqual(graph["model"]["inputs"]["unet_name"], worker.MODEL)
        self.assertEqual(graph["video"]["class_type"], "LoadVideo")
        self.assertEqual(graph["control"]["class_type"], "WanVaceToVideo")
        self.assertEqual(graph["control"]["inputs"]["control_video"], ["edges", 0])
        self.assertEqual(graph["sample"]["inputs"]["positive"], ["control", 0])
        self.assertEqual(graph["trim"]["inputs"]["trim_amount"], ["control", 3])
        self.assertEqual(graph["new_video"]["inputs"]["fps"], 16)
        self.assertNotIn("reference", graph)
        anchored = worker.graph("control.mp4", 12345, "cel", "clip", "reference.png")
        self.assertEqual(
            anchored["control"]["inputs"]["reference_image"], ["reference", 0]
        )

    def test_missing_vace_model_blocks_before_execution(self):
        info = {
            name: {"input": {"required": {}}}
            for name in [
                "UNETLoader", "CLIPLoaderGGUF", "WanVaceToVideo", "LoadVideo",
                "GetVideoComponents", "Canny", "TrimVideoLatent", "CreateVideo",
                "SaveVideo", "ModelSamplingSD3", "VAELoader", "KSampler"
            ]
        }
        info["UNETLoader"]["input"]["required"] = {
            "unet_name": [["some-other-model.safetensors"], {}]
        }
        with patch.object(worker, "send_json", return_value=info):
            with self.assertRaisesRegex(RuntimeError, "GPU model missing"):
                worker.check_comfy("http://127.0.0.1:8188")


@unittest.skipUnless(shutil.which("ffmpeg") and shutil.which("ffprobe"),
                     "ffmpeg and ffprobe required")
class RealMediaTests(unittest.TestCase):
    def test_exact_frames_and_source_audio_after_assembly(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            original = root / "source.mp4"
            subprocess.run([
                "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
                "-f", "lavfi", "-i", "color=c=black:s=720x480:r=16:d=2.5",
                "-f", "lavfi", "-i", "sine=frequency=440:duration=2.5",
                "-c:v", "libx264", "-c:a", "aac", "-shortest", str(original),
            ], check=True, timeout=45)
            self.assertTrue(worker.probe(original)["audio"])
            control = root / "pilot_window_000.mp4"
            worker.extract_window(original, 0, control)
            info = json.loads(subprocess.check_output([
                "ffprobe", "-v", "error", "-select_streams", "v:0",
                "-count_frames", "-show_entries", "stream=nb_read_frames",
                "-of", "json", str(control),
            ]))
            self.assertEqual(int(info["streams"][0]["nb_read_frames"]), 65)
            pilot = {"startSec": 0, "durationSec": 2.5}
            worker.assemble(root, original, pilot, [control], 40, "720p")
            finished = worker.probe(root / "pilot.mp4")
            self.assertTrue(finished["audio"])
            self.assertAlmostEqual(finished["duration"], 2.5, delta=0.25)


if __name__ == "__main__":
    unittest.main()
