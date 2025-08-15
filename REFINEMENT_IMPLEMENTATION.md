# Refinement Feature Implementation

## Overview

This document outlines the implementation of the refinement feature for the 3DA aligner system. The refinement feature allows users to request additional aligners or treatment adjustments after their initial treatment has been delivered.

## Architecture

### Database Schema Changes

1. **Cases Table Extensions**:

   - `parent_case_id BIGINT`: References the original case for refinements (matches cases.id type)
   - `refinement_number INTEGER`: Tracks the refinement iteration
   - `refinement_reason TEXT`: Stores the reason for refinement

2. **Simplified Approach**:
   - Refinement requests create new cases directly
   - No separate requests table needed
   - Uses existing case management workflow

### Component Structure

1. **RefinementSection** (`src/ui/components/RefinementSection.jsx`):

   - User-facing component for requesting refinements
   - Only shows when case status is 'delivered' or 'completed'
   - Simple form with reason input

2. **RefinementHistory** (`src/ui/components/RefinementHistory.jsx`):

   - Displays all refinement requests and cases for a given case
   - Shows status, dates, and admin responses
   - Links to refinement cases

3. **Admin Management**:
   - Admins handle refinements like regular cases
   - No special refinement management interface needed
   - Uses existing case approval workflow

## User Flow

### 1. User Requests Refinement

- User navigates to a case with status 'delivered' or 'completed'
- Clicks "Request Refinement" button
- Fills out form with reason, material selection, and file uploads
- Submits refinement case directly

### 2. Admin Reviews Case

- Admin sees refinement case in regular cases list
- Reviews case details and pricing
- Approves or rejects like any other case
- Provides aligner numbers and pricing details

### 3. Case Processing

- Refinement case follows normal treatment workflow
- Linked to original case via `parent_case_id`
- No acceptance fees for refinements
- User can track progress in refinement history

## Implementation Details

### Database Setup

Run the SQL script `database_refinement_schema.sql` to:

- Add refinement columns to cases table
- Set up proper indexes for parent-child relationships

### Component Integration

The refinement components are integrated into:

- **CasePage**: Shows refinement section and history
- **Admin Cases**: Refinements appear as regular cases in admin interface

### Status Flow

```
Original Case: delivered/completed
    ↓
User Submits Refinement Case: submitted
    ↓
Admin Review: approved/rejected
    ↓
Case Processing: awaiting_user_approval → in_production → ...
```

## Features

### For Users

- Request refinements for delivered/completed cases
- View refinement history and status
- Track multiple refinements per case
- No acceptance fees for refinements

### For Admins

- Review and manage refinement requests
- Approve/reject with notes
- View complete refinement history
- Create new cases from approved requests

### Technical Features

- Proper database relationships and constraints
- Row-level security policies
- Automatic timestamp updates
- Error handling and validation

## Future Enhancements

1. **Enhanced Form**: Add material selection and file uploads to refinement requests
2. **Pricing Integration**: Automatic pricing calculation for refinements
3. **Notification System**: Email/SMS notifications for status changes
4. **Analytics**: Track refinement patterns and success rates
5. **Bulk Operations**: Admin tools for managing multiple refinements

## Security Considerations

- Users can only see their own refinement requests
- Admins have full access to all refinement data
- Proper RLS policies ensure data isolation
- Input validation prevents malicious data

## Testing

Test scenarios should include:

- User requesting refinement on eligible cases
- Admin approving/rejecting requests
- New case creation from approved requests
- Refinement history display
- Error handling for invalid states
- Security policies enforcement
