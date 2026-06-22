const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const verifyToken = require('../middleware/auth');

const router = express.Router();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Using the requested models with thinking level set to HIGH in the config
const generationConfig = {
    thinkingConfig: {
        thinkingLevel: 'HIGH'
    }
};

const primaryModel = genAI.getGenerativeModel({ 
    model: 'gemini-3.1-flash-lite',
    generationConfig
});
const fallbackModel = genAI.getGenerativeModel({ 
    model: 'gemma-4-31b-it',
    generationConfig
});

async function generateWithFallback(prompt) {
    try {
        return await primaryModel.generateContent(prompt);
    } catch (error) {
        console.warn('Primary model failed, falling back to gemma-4-31b-it:', error.message);
        return await fallbackModel.generateContent(prompt);
    }
}

const getFineTunedPrompt = (useCase, aesthetics, formattedDynamicContext, customInstructions) => {
    const universalRules = `
        ### CRITICAL INSTRUCTION: CONTENT EXPANSION & EMOTIONAL DEPTH ###
        1. DO NOT SHORTEN OR SUMMARIZE THE USER'S INPUT. You must include all key details provided.
        2. EXPAND on the content gracefully. If the user provides a brief summary or bullet points, transform them into emotionally resonant, compelling, and professional copy.
        3. MUST SOUND 100% HUMAN-WRITTEN: Do NOT over-exaggerate. Avoid "AI-speak" buzzwords. Keep the tone grounded, authentic, and highly professional.
        4. Create beautifully structured HTML to house this expanded content (e.g., use blockquotes, detailed paragraphs, multi-layered cards).

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

    const baseData = `
        ### USER REQUEST ###
        Aesthetics & Vibe requested: ${aesthetics || 'Ultra-modern, glassmorphism, clean, expensive, and graceful.'}
        
        ### SPECIFIC CONTENT CONTEXT ###
        ${formattedDynamicContext}

        ${customInstructions ? `### ADDITIONAL USER INSTRUCTIONS ###\n        ${customInstructions}\n        (CRITICAL: You MUST strictly adhere to these custom instructions above all else).` : ''}
    `;

    if (useCase === 'Personal Portfolio') {
        return `
        You are a Creative Director & Awwwards-winning Developer. 
        Your job is to generate a highly visual, personality-driven, creative personal portfolio website.

        ### ARCHITECTURE CONTEXT ###
        1. A clean, floating Navigation bar. 
        2. A massive, elegant Hero section with oversized typography. You MUST include an \`<img>\` tag with a high-quality abstract photo placeholder (e.g. \`https://picsum.photos/1200/800\`) or professional headshot placeholder.
        3. A Bento-box style 'About/Skills' grid. 
        4. A 'Selected Works' masonry or flex-wrap grid. 
        5. A beautiful minimal footer.

        ${baseData}
        ${universalRules}
        `;
    }

    if (useCase === 'Startup Landing Page') {
        return `
        You are a Silicon Valley Principal UI/UX Designer & Growth Hacker.
        Your job is to generate a conversion-optimized, high-tech, modern SaaS landing page.

        ### ARCHITECTURE CONTEXT ###
        1. Glassmorphic Sticky Navbar. 
        2. Immersive Hero with a pill-shaped badge, massive headline, glowing CTA. You MUST include a bold product mockup or abstract tech background image placeholder (e.g. \`https://picsum.photos/1200/800\`).
        3. Feature section using a 3-column CSS Grid. 
        4. Social Proof/Testimonials in modern cards. 
        5. Large CTA section & Minimal Footer.

        ${baseData}
        ${universalRules}
        `;
    }

    if (useCase === 'Agency Website') {
        return `
        You are an Executive Creative Director of a top-tier digital agency.
        Your job is to generate a premium B2B agency website focusing on brutalist or elegant minimalism, large typography, and expansive case study cards.

        ### ARCHITECTURE CONTEXT ###
        1. Minimalist Navbar. 
        2. Brutalist/Elegant Hero statement with a large cinematic hero image placeholder overlay (e.g. \`https://picsum.photos/1200/600\`).
        3. Services offered in expansive, hover-animated cards. 
        4. Selected Client Showcase. 
        5. 'Let's Work Together' fluid contact area & Footer.

        ${baseData}
        ${universalRules}
        `;
    }

    if (useCase === 'Product Showcase') {
        return `
        You are a Lead Product Designer at a top D2C brand.
        Your job is to generate an immersive, scroll-driven product reveal page with large whitespace and premium typography.

        ### ARCHITECTURE CONTEXT ###
        1. Elegant Header. 
        2. Immersive Hero featuring the product headline with a giant edge-to-edge product shot placeholder (e.g. \`https://picsum.photos/1200/800\`).
        3. Key benefits section (alternating text/image layout with large whitespace). 
        4. Premium Pricing table. 
        5. Buy Now CTA footer.

        ${baseData}
        ${universalRules}
        `;
    }

    if (useCase === 'Resume / Job Portfolio') {
        return `
        You are an Expert Technical Recruiter & Print Layout Designer.
        Your job is to generate a highly readable, impeccably structured online CV document.
        CRITICAL: This is NOT a standard sprawling website. Do not use excessive web animations or massive abstract heros. Focus purely on a highly structured, clean layout that reads like a professional resume.

        ### ARCHITECTURE CONTEXT ###
        1. Professional, highly readable Header. You MUST include a clean, professional headshot placeholder (circular or rounded square, e.g. \`https://picsum.photos/200/200\`) near the contact info.
        2. Clean Summary section highlighting the current role and objective. 
        3. Detailed Experience timeline or structured cards. 
        4. Education & Certifications grid. 
        5. Professional minimal footer.

        ${baseData}
        ${universalRules}
        `;
    }

    if (useCase === 'Student / Leadership Portfolio') {
        return `
        You are an Ivy League Admissions Consultant & Campaign Manager.
        Your job is to generate a persuasive, narrative-driven campaign or academic profile page highlighting leadership and community impact.

        ### ARCHITECTURE CONTEXT ###
        1. Bold, persuasive Header for a campaign. 
        2. Impactful Hero section stating the Target Position. You MUST include a friendly, approachable headshot or action shot placeholder (e.g. \`https://picsum.photos/400/400\`).
        3. Manifesto/Leadership Vision section. 
        4. Key Achievements and Participation timeline/grid. 
        5. Persuasive CTA footer.

        ${baseData}
        ${universalRules}
        `;
    }

    // Default Fallback
    return `
        You are a World-Class Principal UI/UX Designer and Frontend Developer. 
        Your job is to generate a breathtaking, ultra-modern website.

        ### ARCHITECTURE CONTEXT ###
        A well-organized semantic HTML layout with Header, Main Content Area, and Footer.

        ${baseData}
        ${universalRules}
    `;
};

router.post('/generate', verifyToken, async (req, res) => {
    const { useCase, aesthetics, dynamicData, customInstructions } = req.body;

    if (!useCase || !aesthetics || !dynamicData) {
        return res.status(400).json({ error: 'Missing required architecture details.' });
    }

    const formattedDynamicContext = Object.entries(dynamicData)
        .map(([key, value]) => {
            const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            return `- ${label}: ${value || '(User left this blank. Invent highly creative, premium professional content for this)'}`;
        })
        .join('\n');

    const prompt = getFineTunedPrompt(useCase, aesthetics, formattedDynamicContext, customInstructions);

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
        You are an elite AI Web Developer Co-pilot and Expert Copywriter. The user is editing a website in a drag-and-drop builder.
        They want to modify their existing website based on a new instruction.

        ### CRITICAL RULE: CONTENT PRESERVATION ###
        Do NOT shorten, summarize, or remove existing content unless explicitly asked. Maintain emotional depth and key details.

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