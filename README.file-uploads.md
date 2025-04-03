# MTerra File Upload System

This guide explains how the file upload system works in MTerra and how to troubleshoot common issues.

## Overview

The MTerra Real Estate Management System allows users to upload two types of documents:

1. **IC Softcopy**: Personal identification documents
2. **Proof of Payment**: Payment receipts or bank transfer confirmations

These documents are stored on the server's filesystem and referenced in the database.

## How It Works

### Backend Implementation

The uploads are handled by Multer middleware which:

1. Receives the file from the frontend
2. Stores it in the `backend/uploads` directory
3. Generates a unique filename to prevent collisions
4. Returns the file path to be saved in the database

The file paths in the database follow this format: `uploads/filename.jpg`

### Relevant Files

- **Upload Middleware**: `backend/src/middleware/upload.js`
- **Booking Routes**: `backend/src/routes/bookings.js`
- **Unit Routes**: `backend/src/routes/units.js`
- **Static File Serving**: `backend/src/index.js`

## Common Issues and Fixes

### 1. Images Not Displaying

If images are not displaying in the admin interface, check:

1. **Database paths**: The paths stored in the database should be in the format `uploads/filename.jpg`

2. **File existence**: Verify files exist in the `backend/uploads` directory

3. **Static file serving**: Ensure Express is serving static files correctly:

```javascript
// in backend/src/index.js
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
```

### 2. Path Format Inconsistency

If there's inconsistency in how paths are stored (absolute vs. relative paths), fix them with:

```bash
mongosh mterra --eval 'db.bookings.find().forEach(function(doc) { 
  if(doc.icSoftcopy) { 
    const filename = doc.icSoftcopy.split("/").pop(); 
    db.bookings.updateOne({_id: doc._id}, {$set: {icSoftcopy: "uploads/" + filename}}); 
  } 
  if(doc.proofOfPayment) { 
    const filename = doc.proofOfPayment.split("/").pop(); 
    db.bookings.updateOne({_id: doc._id}, {$set: {proofOfPayment: "uploads/" + filename}}); 
  } 
})'
```

### 3. Frontend Image URL Generation

The frontend needs to correctly convert database paths to valid URLs:

```javascript
const getImageUrl = (filePath) => {
  if (!filePath) return null;

  // If the path already starts with 'uploads/', just append it to the base URL
  if (filePath.startsWith('uploads/')) {
    return `http://localhost:5000/${filePath}`;
  }
  
  // Handle full file paths (for backward compatibility)
  if (filePath.includes('\\') || filePath.includes('/')) {
    // Extract just the filename
    const parts = filePath.split(/[\\\/]/);
    const filename = parts[parts.length - 1];
    return `http://localhost:5000/uploads/${filename}`;
  }
  
  // Default case - just return the path appended to uploads 
  return `http://localhost:5000/uploads/${filePath}`;
};
```

### 4. File Upload Directory Missing

If the uploads directory is missing:

```bash
mkdir -p backend/uploads
chmod 755 backend/uploads
```

## Testing File Uploads

To verify file uploads are working:

1. Create a booking and upload document files through the frontend interface

2. Check the database entries:

```bash
mongosh mterra --eval "db.bookings.findOne({}, {icSoftcopy:1, proofOfPayment:1, _id:0})" | cat
```

3. Verify the files exist in the uploads directory:

```bash
ls -la backend/uploads/
```

4. Test direct file access with curl:

```bash
curl -I http://localhost:5000/uploads/[filename].jpg
```

## Troubleshooting Steps

If uploads are still not working:

1. Check server logs for errors when uploading files

2. Ensure MongoDB connection is working properly

3. Verify the client is correctly sending files in multipart/form-data format

4. Check that the paths in both upload routes are consistent:
   - `backend/src/routes/bookings.js`
   - `backend/src/routes/units.js`

5. Restart the server after making changes to the uploads directory

## Security Considerations

The current implementation accepts:
- Images (any format)
- PDFs

File size is limited to 5MB. Consider adjusting these settings in `upload.js` for production use:

```javascript
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});
``` 