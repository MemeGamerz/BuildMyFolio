const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const verifyToken = require('../middleware/auth');

const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Using the requested models. Added generationConfig for high thinking (if supported)
const primaryModel = genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });
const fallbackModel = genAI.getGenerativeModel({ model: 'gemma-4-31b-it' });

async function generateWithFallback(prompt) {
    const fullPrompt = "SYSTEM INSTRUCTION: SET THINKING TO HIGH. You must think deeply, analyze the request step-by-step, and produce the highest quality, robust output possible before responding.\n\n" + prompt;
    try {
        return await primaryModel.generateContent(fullPrompt);
    } catch (error) {
        console.warn('Primary model failed, falling back to gemma-4-31b-it:', error.message);
        return await fallbackModel.generateContent(fullPrompt);
    }
}

const getSystemContext = (useCase) => {
    const contexts = {
        'Personal Portfolio': `Structure required: 1. A clean, floating Navigation bar. 2. A massive, elegant Hero section with oversized typography. 3. A Bento-box style 'About/Skills' grid. 4. A 'Selected Works' masonry or flex-wrap grid. 5. A beautiful minimal footer.`,
        'Startup Landing Page': `Structure required: 1. Glassmorphic Sticky Navbar. 2. Immersive Hero with a pill-shaped badge, massive headline, and glowing CTA. 3. Feature section using a 3-column CSS Grid. 4. Social Proof/Testimonials in modern cards. 5. Large CTA section. 6. Minimal Footer.`,
        'Agency Website': `Structure required: 1. Minimalist Navbar. 2. Brutalist/Elegant Hero statement. 3. Services offered in expansive, hover-animated cards. 4. Selected Client Showcase. 5. 'Let's Work Together' fluid contact area. 6. Footer.`,
        'Product Showcase': `Structure required: 1. Elegant Header. 2. Immersive Hero featuring the product headline with a soft glowing background. 3. Key benefits section (alternating text/image layout with large whitespace). 4. Premium Pricing table. 5. Buy Now CTA footer.`,
        'Resume / Job Portfolio': `Structure required: 1. Professional, highly readable Header with Contact/Resume Download CTA. 2. Clean Hero section highlighting the current role and objective. 3. Detailed Experience timeline or cards. 4. Education & Certifications grid. 5. Professional minimal footer. Focus on print-friendly or highly structured layout.`,
        'Student / Leadership Portfolio': `Structure required: 1. Bold, persuasive Header for a campaign. 2. Impactful Hero section stating the Target Position. 3. Manifesto/Leadership Vision section. 4. Key Achievements and Participation timeline/grid. 5. Persuasive CTA footer.`
    };
    return contexts[useCase] || `Structure required: A well-organized semantic HTML layout with Header, Main Content Area, and Footer.`;
};

router.post('/generate', verifyToken, async (req, res) => {
    const { useCase, aesthetics, dynamicData } = req.body;

    if (!useCase || !aesthetics || !dynamicData) {
        return res.status(400).json({ error: 'Missing required architecture details.' });
    }

    const formattedDynamicContext = Object.entries(dynamicData)
        .map(([key, value]) => {
            const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            return `- ${label}: ${value || '(User left this blank. Invent highly creative, premium professional content for this)'}`;
        })
        .join('\n');

    const prompt = `
        You are a World-Class Principal UI/UX Designer and Awwwards-winning Frontend Developer. 
        Your job is to generate a breathtaking, ultra-modern, graceful, and highly fluid website.

        ### USER REQUEST ###
        Website Archetype: ${useCase}
        Aesthetics & Vibe requested: ${aesthetics || 'Ultra-modern, glassmorphism, clean, expensive, and graceful.'}
        
        ### SPECIFIC CONTENT CONTEXT ###
        ${formattedDynamicContext}
        
        ### ARCHITECTURE CONTEXT ###
        ${getSystemContext(useCase)}

        ### INSTRUCTION 1: ULTRA-MODERN AESTHETICS & RESPONSIVENESS ###
        1. Make the design feel EXPENSIVE and GRACEFUL. Use Glassmorphism, subtle gradients, rounded corners, and generous whitespace.
        2. You MUST build every layout using completely modular CSS Flexbox (\`display: flex; flex-wrap: wrap; gap: 2rem;\`) or CSS Grid.
        3. Include \`@media (max-width: 768px)\` to stack grids/flex containers to 1 column.

        ### INSTRUCTION 2: COLOR, CONTRAST & WRAPPER ###
        1. Wrap the ENTIRE HTML content inside a single \`<div id="website-root">...</div>\`.
        2. In CSS, target \`#website-root\` and explicitly define the base \`background\` and text \`color\`. Maintain strict contrast rules (Dark bg = light text, Light bg = dark text).
        3. Start your CSS with a global reset: \`* { box-sizing: border-box; margin: 0; padding: 0; }\`

        ### INSTRUCTION 3: FUNCTIONAL JAVASCRIPT (CRITICAL NEW FEATURE) ###
        1. If the user's prompt implies interactivity (e.g., "Add a theme change button", "interactive slider", "mobile menu toggle"), you MUST write robust, vanilla JavaScript to make it work perfectly.
        2. Write the JavaScript inside a standard \`<script> ... </script>\` tag and place it at the VERY BOTTOM of your \`html\` string output (inside or just after the #website-root div).
        3. Ensure your JS targets the correct IDs/Classes you generated. (e.g., if you make a dark mode toggle, write the JS to toggle a '.dark-theme' class on #website-root and supply the corresponding CSS).

        Generate the response strictly as a JSON object containing EXACTLY two keys:
        1. "html": Semantic HTML5 elements inside \`<div id="website-root">...</div>\`, AND optionally ending with your \`<script>\` tag. NO <html> or <body> tags.
        2. "css": Raw, highly-polished CSS targeting your HTML classes and \`#website-root\`. NO <style> tags.

        Return ONLY the raw JSON object. Do not include markdown formatting like \`\`\`json.
    `;

    try {
        const result = await generateWithFallback(prompt);
        let textResponse = result.response.text();
        textResponse = textResponse.replace(/^```json/g, '').replace(/```$/g, '').trim();
        const parsedData = JSON.parse(textResponse);
        res.status(200).json({ html: parsedData.html, css: parsedData.css });
    } catch (error) {
        console.error('AI Generation Error:', error);
        res.status(500).json({ error: 'Failed to generate website layout via AI.' });
    }
});

router.post('/edit', verifyToken, async (req, res) => {
    const { html, css, prompt: userPrompt } = req.body;

    if (!html || !css || !userPrompt) {
        return res.status(400).json({ error: 'Missing current canvas data or prompt.' });
    }

    const aiPrompt = `
        You are an elite AI Web Developer Co-pilot. The user is editing a website in a drag-and-drop builder.
        They want to modify their existing website based on a new instruction.

        ### USER'S INSTRUCTION ###
        "${userPrompt}"

        ### CURRENT HTML (May include <script> tags) ###
        ${html}

        ### CURRENT CSS ###
        ${css}

        ### TASK & JAVASCRIPT RULES ###
        1. Apply the user's instructions to the HTML and CSS intelligently.
        2. Maintain the #website-root wrapper and global CSS resets.
        3. If the user asks for interactivity (e.g., "Add a dark mode toggle button"), generate the required HTML button, the CSS styles for the toggle state, AND the vanilla JavaScript inside a \`<script>\` tag at the bottom of the HTML output to make it function.
        4. If there is an existing \`<script>\` tag, preserve it or update it as necessary.
        5. Output the COMPLETE updated HTML and COMPLETE updated CSS.

        Generate the response strictly as a JSON object containing EXACTLY two keys:
        1. "html": The complete updated HTML (including any <script> tags).
        2. "css": The complete updated CSS.

        Return ONLY the raw JSON object. Do not include markdown formatting like \`\`\`json.
    `;

    try {
        const result = await generateWithFallback(aiPrompt);
        let textResponse = result.response.text();
        textResponse = textResponse.replace(/^```json/g, '').replace(/```$/g, '').trim();
        const parsedData = JSON.parse(textResponse);
        res.status(200).json({ html: parsedData.html, css: parsedData.css });
    } catch (error) {
        console.error('AI Edit Error:', error);
        res.status(500).json({ error: 'Failed to apply edits via AI.' });
    }
});

module.exports = router;