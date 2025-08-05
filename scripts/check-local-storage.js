// Check what's in localStorage
const tasks = [
  {
    "id": "1736153524515",
    "team": "white",
    "companyName": "Providence Hill Group (Richmond, VA)",
    "createdAt": "2025-08-05T10:32:04.515Z",
    "status": "processing",
    "requestId": "research_dc8b626ac99f"
  }
];

console.log("Local storage tasks showing as processing:");
tasks.forEach(task => {
  console.log(`- ${task.companyName} (${task.team}): ${task.status} - RequestID: ${task.requestId}`);
});
EOF < /dev/null