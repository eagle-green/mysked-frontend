# Cloudinary Folder Structure for User Assets

This document explains the new folder structure implemented for organizing user assets in Cloudinary.

## Folder Structure

When a user is created, a folder structure is automatically created in Cloudinary:

```
users/
└── {userId}/
    ├── profile_{userId}          # Profile picture
    ├── tcp_certification_{userId} # TCP certification
    ├── driver_license_{userId}    # Driver license
    └── other_documents_{userId}   # Other documents
```

## How It Works

### 1. Automatic Folder Creation
- When an admin creates a new user, a folder is automatically created in Cloudinary
- The folder path is: `users/{userId}/`
- This happens in the backend `createUser` function
- A temporary placeholder file is created to establish the folder structure
- The placeholder file may remain visible briefly but doesn't affect functionality

### 2. Asset Upload
- Each asset type has its own file naming convention
- Files are uploaded to the user's specific folder
- The public_id format is: `{assetType}_{userId}`

### 3. Asset Types
- `profile`: User profile picture
- `tcp_certification`: TCP (Traffic Control Person) certification
- `driver_license`: Driver license or permit
- `other_documents`: Any other relevant documents

### 4. Automatic Cleanup
- When a user is deleted, all their assets are automatically deleted from Cloudinary
- This includes profile pictures, certifications, licenses, and other documents
- The cleanup happens in the background and doesn't block the user deletion
- If cleanup fails, the user is still deleted but assets remain (logged for manual cleanup)

## Usage Examples

### Upload Profile Picture
```typescript
import { uploadUserAsset } from 'src/utils/cloudinary-upload';

const profileUrl = await uploadUserAsset({
  file: profileFile,
  userId: 'user-123',
  assetType: 'profile',
});
```

### Upload TCP Certification
```typescript
const tcpUrl = await uploadUserAsset({
  file: tcpFile,
  userId: 'user-123',
  assetType: 'tcp_certification',
});
```

### Delete an Asset
```typescript
import { deleteUserAsset } from 'src/utils/cloudinary-upload';

await deleteUserAsset('user-123', 'tcp_certification');
```

### Get Asset Public ID
```typescript
import { getUserAssetPublicId } from 'src/utils/cloudinary-upload';

const publicId = getUserAssetPublicId('user-123', 'profile');
// Returns: "users/user-123/profile_user-123"
```

## Components

### UserAssetsUpload Component
A reusable component for uploading user assets:

```typescript
import { UserAssetsUpload } from 'src/sections/contact/user/user-assets-upload';

<UserAssetsUpload
  userId="user-123"
  currentAssets={{
    tcp_certification_url: "https://...",
    driver_license_url: "https://...",
  }}
  onAssetsUpdate={(assets) => {
    // Handle assets update
  }}
/>
```

## Backend Integration

### Folder Creation Endpoint
- **POST** `/api/cloudinary/create-user-folder/:userId`
- Creates the user folder structure in Cloudinary
- Called automatically when a user is created
- Creates a temporary placeholder file to establish the folder structure

### Signature Endpoint
- **GET** `/api/cloudinary/signature`
- Generates signed parameters for Cloudinary uploads
- Supports folder-based uploads

### Delete User Assets Endpoint
- **DELETE** `/api/cloudinary/delete-user-assets/:userId`
- Deletes all assets for a specific user
- Called automatically when a user is deleted
- Can be called manually if needed

## Benefits

1. **Organization**: Each user's assets are organized in their own folder
2. **Scalability**: Easy to add new asset types
3. **Security**: Proper access control through signed URLs
4. **Maintainability**: Clear naming conventions and structure
5. **Flexibility**: Support for different file types and sizes
6. **Automatic Cleanup**: User assets are automatically deleted when the user is deleted

## File Size Limits

- Profile pictures: 3MB
- TCP Certification: 5MB
- Driver License: 5MB
- Other Documents: 10MB

## Supported File Types

- Images: JPEG, JPG, PNG
- Documents: PDF
- All files are validated before upload 