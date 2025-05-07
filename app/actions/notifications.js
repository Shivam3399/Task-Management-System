'use server';

import pool from '../api/db';
import { revalidatePath } from 'next/cache';

// Create a notification
export async function createNotification(data) {
  try {
    const { user_id, type, title, message, related_id } = data;
    
    const query = `
      INSERT INTO notifications (user_id, type, title, message, related_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const values = [user_id, type, title, message, related_id];
    const result = await pool.query(query, values);
    
    return result.rows[0];
  } catch (error) {
    console.error('Error creating notification:', error);
    throw new Error('Failed to create notification');
  }
}

// Get notifications for a user
export async function getUserNotifications(userId) {
  try {
    const query = `
      SELECT * FROM notifications
      WHERE user_id = $1
      ORDER BY created_at DESC
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw new Error('Failed to fetch notifications');
  }
}

// Mark notification as read
export async function markNotificationAsRead(notificationId) {
  try {
    const query = `
      UPDATE notifications
      SET is_read = TRUE
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await pool.query(query, [notificationId]);
    revalidatePath('/notifications');
    return result.rows[0];
  } catch (error) {
    console.error('Error updating notification:', error);
    throw new Error('Failed to update notification');
  }
}
