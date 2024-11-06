// scripts/addFilePathComment.js
const fs = require('fs')
const path = require('path')

function addOrUpdateFilePathComment(filePath) {
  const relativePath = path.relative(process.cwd(), filePath)
  const pathComment = `// ${relativePath}`
  const fileContent = fs.readFileSync(filePath, 'utf8')

  // Check if the file already starts with a path comment
  const lines = fileContent.split('\n')
  if (lines[0].startsWith('//')) {
    // Update the existing path comment
    lines[0] = pathComment
  } else {
    // Add a new path comment if none exists
    lines.unshift(pathComment, '')
  }

  // Write the modified content back to the file
  const newContent = lines.join('\n')
  fs.writeFileSync(filePath, newContent, 'utf8')
}

// Get the list of staged files from Git
const execSync = require('child_process').execSync
const stagedFiles = execSync('git diff --cached --name-only --diff-filter=ACM')
  .toString()
  .trim()
  .split('\n')

// Apply the path comment only to JavaScript, TypeScript, or Vue files
stagedFiles.forEach((file) => {
  if (/\.(js|ts|vue)$/.test(file) && fs.existsSync(file)) {
    addOrUpdateFilePathComment(file)
  }
})
