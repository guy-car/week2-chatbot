curl -s -X POST http://localhost:3000/api/chat-v2 \
  -H 'Content-Type: application/json' \
  -d '{
    "id": "lDGO1EOw4BVdQmHk",
    "messages": [
      {
        "id": "u2",
        "role": "user",
        "content": "I really like Terrence Malick, whats his best work? Can you recommend some other movies/directors that are similar?"
      }
    ]
  }' | cat
