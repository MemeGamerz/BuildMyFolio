const express = require('express');
const db = require('../db');
const verifyToken = require('../middleware/auth');

const router = express.Router();

// Create new project
router.post('/', verifyToken, async (req, res) => {
    const { title, project_data, html_content, css_content } = req.body;
    const userId = req.user.id;

    if (!title) {
        return res.status(400).json({ error: 'Project title is required' });
    }

    try {
        const [result] = await db.query(
            'INSERT INTO projects (user_id, title, project_data, html_content, css_content) VALUES (?, ?, ?, ?, ?)',
            [userId, title, project_data ? JSON.stringify(project_data) : null, html_content || '', css_content || '']
        );
        res.status(201).json({ message: 'Project created successfully', projectId: result.insertId });
    } catch (error) {
        console.error('Create Project Error:', error);
        res.status(500).json({ error: 'Failed to create project' });
    }
});

// Get all projects for the logged-in user
router.get('/', verifyToken, async (req, res) => {
    const userId = req.user.id;

    try {
        const [projects] = await db.query(
            'SELECT id, title, created_at, updated_at FROM projects WHERE user_id = ? ORDER BY updated_at DESC',
            [userId]
        );
        res.status(200).json(projects);
    } catch (error) {
        console.error('Fetch Projects Error:', error);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

// Get a specific project (Loads into Editor)
router.get('/:id', verifyToken, async (req, res) => {
    const userId = req.user.id;
    const projectId = req.params.id;

    try {
        const [projects] = await db.query(
            'SELECT * FROM projects WHERE id = ? AND user_id = ?',
            [projectId, userId]
        );

        if (projects.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
        }

        res.status(200).json(projects[0]);
    } catch (error) {
        console.error('Fetch Single Project Error:', error);
        res.status(500).json({ error: 'Failed to fetch project details' });
    }
});

// Update an existing project (Save from Editor)
router.put('/:id', verifyToken, async (req, res) => {
    const userId = req.user.id;
    const projectId = req.params.id;
    const { title, project_data, html_content, css_content } = req.body;

    try {
        const [updateResult] = await db.query(
            'UPDATE projects SET title = COALESCE(?, title), project_data = COALESCE(?, project_data), html_content = COALESCE(?, html_content), css_content = COALESCE(?, css_content) WHERE id = ? AND user_id = ?',
            [
                title !== undefined ? title : null,
                project_data !== undefined ? (project_data ? JSON.stringify(project_data) : null) : null,
                html_content !== undefined ? html_content : null,
                css_content !== undefined ? css_content : null,
                projectId,
                userId
            ]
        );

        if (updateResult.affectedRows === 0) {
            return res.status(404).json({ error: 'Project not found or unauthorized' });
        }

        res.status(200).json({ message: 'Project saved successfully' });
    } catch (error) {
        console.error('Update Project Error:', error);
        res.status(500).json({ error: 'Failed to save project' });
    }
});

// Delete a project
router.delete('/:id', verifyToken, async (req, res) => {
    const userId = req.user.id;
    const projectId = req.params.id;

    try {
        const [deleteResult] = await db.query(
            'DELETE FROM projects WHERE id = ? AND user_id = ?',
            [projectId, userId]
        );

        if (deleteResult.affectedRows === 0) {
            return res.status(404).json({ error: 'Project not found or unauthorized' });
        }

        res.status(200).json({ message: 'Project deleted successfully' });
    } catch (error) {
        console.error('Delete Project Error:', error);
        res.status(500).json({ error: 'Failed to delete project' });
    }
});

module.exports = router;