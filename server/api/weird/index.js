// api/weird.js

export default async (req, res) => {
  if (req.method === 'GET') {
    // You can add conditions here for different rounds or other logic
    const defaultButtons = [
      { label: 'New Story', action: 'new_story' },
      { label: 'Character', action: 'character' },
      { label: 'Custom Prompt', action: 'custom_prompt' }
      // Add more buttons based on your logic or round conditions
    ]

    res.status(200).json({ buttons: defaultButtons })
  } else {
    res.status(405).end() // Method not allowed
  }
}
