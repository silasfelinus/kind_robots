<style scoped>
/* Flip-card style */
.flip-card {
  perspective: 1500px;
  width: 100%;
  height: 100%;
}

.flip-card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.6s;
  transform-style: preserve-3d;
}

.flip-card-front,
.flip-card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 5px;
}

.flip-card-front {
  z-index: 2;
}

.flip-card-back {
  transform: rotateY(180deg);
  z-index: 1;
}

/* Add the flipped class to trigger the flip animation */
.flip-card-inner.flipped {
  transform: rotateY(180deg);
}
</style>
