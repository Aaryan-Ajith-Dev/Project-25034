# User Update API Documentation

## Overview
The user update API allows authenticated users to update their profile information.

## Endpoint
`PUT /user/me`

## Authentication
Requires Bearer token authentication.

## Request Format
All fields are optional. Only include the fields you want to update:

```json
{
    "name": "John Doe",
    "phone": "+1234567890", 
    "location": "New York, NY",
    "summary": "Experienced software developer...",
    "skills": "Python, JavaScript, React",
    "role": "Software Engineer",
    "education": [
        {
            "school": "University of Technology",
            "degree": "Bachelor of Computer Science",
            "grade": "3.8 GPA",
            "startDate": "2018-09",
            "endDate": "2022-05",
            "description": "Computer Science with focus on web development"
        }
    ],
    "experience": [
        {
            "company": "Tech Corp",
            "position": "Software Developer",
            "startDate": "2022-06",
            "endDate": "2024-01",
            "description": "Developed web applications using Python and React"
        }
    ],
    "gender": "male",
    "disability": "None"
}
```

## Response Format
Returns the updated user profile (same as GET /user/me):

```json
{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "location": "New York, NY", 
    "summary": "Experienced software developer...",
    "skills": "Python, JavaScript, React",
    "role": "Software Engineer",
    "education": [...],
    "experience": [...],
    "gender": "male",
    "disability": "None"
}
```

## Features
- **Partial Updates**: Only send the fields you want to change
- **Automatic Embedding Update**: When profile data changes, user embeddings are automatically regenerated for better job matching
- **Validation**: All fields are validated according to the user model
- **Security**: Only authenticated users can update their own profile

## Usage Examples

### Update Name and Location
```python
import requests

headers = {"Authorization": "Bearer YOUR_JWT_TOKEN"}
data = {
    "name": "Jane Smith",
    "location": "San Francisco, CA"
}

response = requests.put("http://localhost:8000/user/me", 
                       json=data, headers=headers)
print(response.json())
```

### Add Experience
```python
import requests

headers = {"Authorization": "Bearer YOUR_JWT_TOKEN"}
data = {
    "experience": [
        {
            "company": "New Company",
            "position": "Senior Developer", 
            "startDate": "2024-02",
            "endDate": null,
            "description": "Leading development team"
        }
    ]
}

response = requests.put("http://localhost:8000/user/me",
                       json=data, headers=headers)
```

### JavaScript Example
```javascript
const token = "YOUR_JWT_TOKEN";
const updateData = {
    skills: "Python, React, Node.js, Docker",
    summary: "Full-stack developer with 5+ years experience"
};

const response = await fetch("http://localhost:8000/user/me", {
    method: "PUT",
    headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
    },
    body: JSON.stringify(updateData)
});

const updatedUser = await response.json();
console.log(updatedUser);
```

## Error Responses
- `400 Bad Request` - No fields to update or validation errors
- `401 Unauthorized` - Missing or invalid authentication token
- `404 Not Found` - User not found
- `422 Unprocessable Entity` - Invalid data format

## Notes
- The embedding field is automatically updated when profile-related fields change
- Password cannot be updated through this endpoint (use a separate password change endpoint)
- Email cannot be updated (would require email verification)
- All updates are atomic - either all changes succeed or none are applied