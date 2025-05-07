import { pool } from '../db';
import { revalidatePath } from 'next/cache';

// Create a new task
export async function createTask(taskData) {
  try {
    const { 
      title, 
      description, 
      due_date, 
      priority, 
      status_id, 
      category_id, 
      assigned_to, 
      created_by 
    } = taskData;
    
    // Begin transaction
    await pool.query('BEGIN');
    
    const query = `
      INSERT INTO tasks (
        title, 
        description, 
        due_date, 
        priority, 
        status_id, 
        category_id, 
        assigned_to, 
        created_by, 
        created_at, 
        updated_at
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING *
    `;
    
    const values = [
      title,
      description,
      due_date,
      priority,
      status_id,
      category_id,
      assigned_to,
      created_by
    ];
    
    const result = await pool.query(query, values);
    const newTask = result.rows[0];
    
    // If task is assigned to someone, create a notification
    if (assigned_to && assigned_to !== created_by) {
      // Get creator's username
      const creatorQuery = 'SELECT username FROM users WHERE id = $1';
      const creatorResult = await pool.query(creatorQuery, [created_by]);
      const creatorName = creatorResult.rows[0]?.username || 'Someone';
      
      // Create notification
      const notificationQuery = `
        INSERT INTO notifications (
          user_id, 
          type, 
          title, 
          message, 
          related_id
        )
        VALUES ($1, $2, $3, $4, $5)
      `;
      
      const notificationValues = [
        assigned_to,
        'task_assigned',
        'New Task Assigned',
        `${creatorName} assigned you a task: ${title}`,
        newTask.id
      ];
      
      await pool.query(notificationQuery, notificationValues);
    }
    
    // Commit transaction
    await pool.query('COMMIT');
    
    revalidatePath('/tasks');
    return newTask;
  } catch (error) {
    // Rollback transaction on error
    await pool.query('ROLLBACK');
    console.error('Error creating task:', error);
    throw new Error('Failed to create task');
  }
}

// Update an existing task
export async function updateTask(id, taskData) {
  try {
    // Begin transaction
    await pool.query('BEGIN');
    
    // Get the current task to check if assignment changed
    const currentTaskQuery = 'SELECT * FROM tasks WHERE id = $1';
    const currentTaskResult = await pool.query(currentTaskQuery, [id]);
    const currentTask = currentTaskResult.rows[0];
    
    if (!currentTask) {
      throw new Error('Task not found');
    }
    
    // Build the SET clause dynamically based on provided fields
    const updates = [];
    const values = [id]; // First parameter is the task ID
    let paramIndex = 2; // Start from $2 since $1 is the task ID
    
    // Add each field that is provided to the updates array
    for (const [key, value] of Object.entries(taskData)) {
      if (value !== undefined) {
        updates.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }
    
    // Always update the updated_at timestamp
    updates.push(`updated_at = NOW()`);
    
    // If no fields to update, just return the existing task
    if (updates.length === 0) {
      await pool.query('ROLLBACK');
      return currentTask;
    }
    
    const query = `
      UPDATE tasks 
      SET ${updates.join(', ')} 
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    const updatedTask = result.rows[0];
    
    // Check if assignment changed
    if (
      taskData.assigned_to && 
      currentTask.assigned_to !== taskData.assigned_to &&
      taskData.assigned_to !== taskData.updated_by
    ) {
      // Get updater's username
      const updaterQuery = 'SELECT username FROM users WHERE id = $1';
      const updaterResult = await pool.query(updaterQuery, [taskData.updated_by]);
      const updaterName = updaterResult.rows[0]?.username || 'Someone';
      
      // Create notification
      const notificationQuery = `
        INSERT INTO notifications (
          user_id, 
          type, 
          title, 
          message, 
          related_id
        )
        VALUES ($1, $2, $3, $4, $5)
      `;
      
      const notificationValues = [
        taskData.assigned_to,
        'task_assigned',
        'Task Assigned to You',
        `${updaterName} assigned you a task: ${updatedTask.title}`,
        id
      ];
      
      await pool.query(notificationQuery, notificationValues);
    }
    
    // Commit transaction
    await pool.query('COMMIT');
    
    revalidatePath('/tasks');
    return updatedTask;
  } catch (error) {
    // Rollback transaction on error
    await pool.query('ROLLBACK');
    console.error(`Error updating task ${id}:`, error);
    throw new Error('Failed to update task');
  }
}
