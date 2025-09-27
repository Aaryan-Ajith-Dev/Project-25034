# User History API Documentation

## Overview
The user history API allows authenticated users to manage their job application history. Users can add jobs they've applied to, view their history with full job details, and remove jobs from their history.

## Endpoints

### 1. Get User History
`GET /user/history`

**Authentication:** Required (Bearer token)

**Description:** Retrieves the user's job application history with full job details.

**Response:**
```json
[
    {
        "id": "job123",
        "title": "Software Engineer",
        "company": "Tech Corp",
        "location": "San Francisco, CA",
        "employmentType": "Full-time",
        "description": "Join our engineering team...",
        "salaryMin": 80000,
        "salaryMax": 120000,
        "currency": "USD",
        "raw": {...}
    },
    {
        "id": "job456",
        "title": "Frontend Developer",
        "company": "Web Solutions",
        "location": "Remote",
        "employmentType": "Contract",
        "description": "React developer needed...",
        "salaryMin": 60000,
        "salaryMax": 90000,
        "currency": "USD",
        "raw": {...}
    }
]
```

### 2. Add Job to History
`POST /user/history`

**Authentication:** Required (Bearer token)

**Description:** Adds a job to the user's application history.

**Request Body:**
```json
{
    "job_id": "job123"
}
```

**Response:**
```json
{
    "message": "Job added to history successfully",
    "job_id": "job123",
    "history_count": 5
}
```

### 3. Remove Job from History
`DELETE /user/history/{job_id}`

**Authentication:** Required (Bearer token)

**Description:** Removes a specific job from the user's application history.

**Path Parameters:**
- `job_id` (string): The ID of the job to remove

**Response:**
```json
{
    "message": "Job removed from history successfully",
    "job_id": "job123",
    "history_count": 4
}
```

### 4. Clear All History
`DELETE /user/history`

**Authentication:** Required (Bearer token)

**Description:** Removes all jobs from the user's application history.

**Response:**
```json
{
    "message": "History cleared successfully",
    "job_id": null,
    "history_count": 0
}
```

## Usage Examples

### Python Examples

#### Get History
```python
import requests

headers = {"Authorization": "Bearer YOUR_JWT_TOKEN"}

response = requests.get("http://localhost:8000/user/history", headers=headers)
history = response.json()

print(f"Found {len(history)} jobs in history")
for job in history:
    print(f"- {job['title']} at {job['company']}")
```

#### Add Job to History
```python
import requests

headers = {"Authorization": "Bearer YOUR_JWT_TOKEN"}
data = {"job_id": "job123"}

response = requests.post("http://localhost:8000/user/history", 
                        json=data, headers=headers)
result = response.json()
print(f"Added job. Total history count: {result['history_count']}")
```

#### Remove Job from History
```python
import requests

headers = {"Authorization": "Bearer YOUR_JWT_TOKEN"}
job_id = "job123"

response = requests.delete(f"http://localhost:8000/user/history/{job_id}", 
                          headers=headers)
result = response.json()
print(f"Removed job. Remaining history count: {result['history_count']}")
```

#### Clear History
```python
import requests

headers = {"Authorization": "Bearer YOUR_JWT_TOKEN"}

response = requests.delete("http://localhost:8000/user/history", headers=headers)
result = response.json()
print(result['message'])
```

### JavaScript Examples

#### Get History
```javascript
const token = "YOUR_JWT_TOKEN";

const response = await fetch("http://localhost:8000/user/history", {
    headers: {
        "Authorization": `Bearer ${token}`
    }
});

const history = await response.json();
console.log(`Found ${history.length} jobs in history`);

history.forEach(job => {
    console.log(`- ${job.title} at ${job.company}`);
});
```

#### Add Job to History
```javascript
const token = "YOUR_JWT_TOKEN";
const jobId = "job123";

const response = await fetch("http://localhost:8000/user/history", {
    method: "POST",
    headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
    },
    body: JSON.stringify({ job_id: jobId })
});

const result = await response.json();
console.log(`Added job. Total history count: ${result.history_count}`);
```

#### Remove Job from History
```javascript
const token = "YOUR_JWT_TOKEN";
const jobId = "job123";

const response = await fetch(`http://localhost:8000/user/history/${jobId}`, {
    method: "DELETE",
    headers: {
        "Authorization": `Bearer ${token}`
    }
});

const result = await response.json();
console.log(`Removed job. Remaining history count: ${result.history_count}`);
```

## Error Responses

### Common Error Codes
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Missing or invalid authentication token
- `404 Not Found` - User not found, job not found, or job not in history
- `409 Conflict` - Job already exists in history (when adding)
- `422 Unprocessable Entity` - Invalid data format
- `500 Internal Server Error` - Server error during operation

### Example Error Response
```json
{
    "detail": "Job not found in history"
}
```

## Features

✅ **Full Job Details**: GET endpoint returns complete job information, not just IDs
✅ **Duplicate Prevention**: Cannot add the same job twice to history
✅ **Order Preservation**: History maintains the order jobs were added
✅ **Bulk Operations**: Clear all history at once
✅ **Validation**: Ensures jobs exist before adding to history
✅ **Authentication**: All endpoints require valid JWT token
✅ **Error Handling**: Comprehensive error messages for all scenarios

## Notes

- History is stored as a list of job IDs in the user document
- The GET endpoint fetches full job details by joining with the jobs collection
- Jobs are returned in the same order they appear in the user's history list
- Removing a non-existent job from history returns a 404 error
- The `embedding` field is excluded from job responses for cleaner output
- MongoDB `_id` fields are also excluded from responses