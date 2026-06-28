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

const getFineTunedPrompt = (useCase, portfolioFormat, aesthetics, formattedDynamicContext, customInstructions) => {
    const universalRules = `
        ### CRITICAL INSTRUCTION: CONTENT REPHRASING & RESTRAINT ###
        1. REPHRASE the user's input to make sense within the context of a professional portfolio structure.
        2. STRICT RESTRAINT: DO NOT EXAGGERATE, do NOT add emotional depth, and DO NOT go into more depth than required by the user. Keep it strictly grounded.
        3. MUST SOUND 100% HUMAN-WRITTEN: Avoid "AI-speak" buzzwords. Keep the tone authentic and highly professional.
        4. Create beautifully structured HTML to house this content.

        ### INSTRUCTION 1: ULTRA-PREMIUM VERCEL/LINEAR AESTHETICS ###
        1. Act as a Principal Design Engineer at Vercel or Linear. 
        2. The design MUST be minimalist, high-contrast, and deeply elegant. Use massive amounts of whitespace, crisp typography (Inter or similar), and extremely clean grid/flexbox layouts.
        3. Do NOT use cheap, bulky shadows or generic UI paradigms. Use subtle borders (e.g., \`border: 1px solid rgba(255,255,255,0.1)\`), incredibly soft glows, and monochromatic or highly muted color palettes unless otherwise specified.
        4. Include \`@media (max-width: 768px)\` to stack grids/flex containers to 1 column.

        ### INSTRUCTION 2: SMOOTH, SUBTLE MICRO-ANIMATIONS ###
        1. All animations MUST be extremely subtle, fluid, and premium. Use \`transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);\` (ease-out-expo) for hover states.
        2. DO NOT use bouncy, wobbly, or cheap jarring animations. Use subtle opacity fades (\`opacity: 0\` to \`opacity: 1\`) and tiny Y-axis translations (\`translateY(10px)\` to \`0\`).
        3. Implement elegant entrance animations for key sections using CSS \`@keyframes\` and \`animation-fill-mode: forwards\`.

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

    if (useCase === 'Personal Portfolio' && portfolioFormat === 'Website') {
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

    if (useCase === 'Personal Portfolio' && portfolioFormat === 'Resume (PDF)') {
        return `
        You are an Expert Technical Recruiter & Print Layout Designer.
        Your job is to generate a highly readable, impeccably structured single-page CV document.
        CRITICAL: This is NOT a standard sprawling website. Focus purely on a highly structured, clean layout that reads like a professional printed resume.

        ### ARCHITECTURE CONTEXT (CANVA-STYLE PDF) ###
        1. Wrap the entire content inside a container that looks like an A4 page: \`width: 210mm; min-height: 297mm; max-width: 100%; margin: 40px auto; background: white; padding: 20mm; box-shadow: 0 10px 30px rgba(0,0,0,0.1); position: relative;\`.
        2. CRITICAL - FREE DRAG & DROP: Every single major section or text block inside this A4 page MUST have \`position: absolute;\` with exact \`top\` and \`left\` pixel or percentage values so the user can drag and drop them freely in the canvas editor, just like Canva. 
        3. Professional, highly readable Header. Include a clean, professional headshot placeholder (e.g. \`https://picsum.photos/200/200\`).
        4. Detailed Experience timeline, Education, and Skills sections.
        5. CRITICAL - NO COLLAPSIBLE MEDIA QUERIES: Do NOT generate any @media queries that make the layout relative, collapse the A4 page size, or stack the absolute-positioned blocks vertically on mobile. The PDF layout must remain fixed and absolute on all screen sizes.

        ${baseData}
        ${universalRules}
        `;
    }

    if (useCase === 'Personal Portfolio' && portfolioFormat === 'Student Portfolio (PDF)') {
        return `
        You are an Ivy League Admissions Consultant & Print Designer.
        Your job is to generate a persuasive, single-page academic profile document highlighting leadership and community impact.

        ### ARCHITECTURE CONTEXT (CANVA-STYLE PDF) ###
        1. Wrap the entire content inside a container that looks like an A4 page: \`width: 210mm; min-height: 297mm; max-width: 100%; margin: 40px auto; background: white; padding: 20mm; box-shadow: 0 10px 30px rgba(0,0,0,0.1); position: relative;\`.
        2. CRITICAL - FREE DRAG & DROP: Every single major section, image, or text block inside this A4 page MUST have \`position: absolute;\` with exact \`top\` and \`left\` pixel or percentage values so the user can drag and drop them freely in the canvas editor, just like Canva. 
        3. Impactful Hero/Header stating the Target Position. Include a friendly headshot placeholder (e.g. \`https://picsum.photos/200/200\`).
        4. Manifesto/Academic Objective section, Key Achievements, and Relevant Coursework.
        5. CRITICAL - NO COLLAPSIBLE MEDIA QUERIES: Do NOT generate any @media queries that make the layout relative, collapse the A4 page size, or stack the absolute-positioned blocks vertically on mobile. The PDF layout must remain fixed and absolute on all screen sizes.

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

    // Removed old Resume/Student conditionals since they are now nested.

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
    const { useCase, portfolioFormat, aesthetics, dynamicData, customInstructions } = req.body;

    if (!useCase || !aesthetics || !dynamicData) {
        return res.status(400).json({ error: 'Missing required architecture details.' });
    }

    const formattedDynamicContext = Object.entries(dynamicData)
        .map(([key, value]) => {
            const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
            return `- ${label}: ${value || '(User left this blank. Invent highly creative, premium professional content for this)'}`;
        })
        .join('\n');

    const prompt = getFineTunedPrompt(useCase, portfolioFormat, aesthetics, formattedDynamicContext, customInstructions);

    try {
        const result = await generateWithFallback(prompt);
        let textResponse = result.response.text();
        
        const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error("AI Output did not contain JSON:", textResponse);
            throw new Error("No JSON object found in response");
        }
        
        try {
            const parsedData = JSON.parse(jsonMatch[0]);
            res.status(200).json({ html: parsedData.html, css: parsedData.css });
        } catch (parseError) {
            console.error("Failed to parse JSON. Extracted string:", jsonMatch[0]);
            console.error("Parse Error Details:", parseError.message);
            throw parseError;
        }
    } catch (error) {
        require('fs').appendFileSync('ai-debug.log', new Date().toISOString() + ' GENERATE ERROR: ' + (error.stack || error) + '\n');
        console.error('AI Generation Error:', error.message || error);
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
        Do NOT shorten, summarize, or remove existing content unless explicitly asked. Maintain key details and strictly adhere to the user's constraints. Do NOT exaggerate.

        ### USER'S INSTRUCTION ###
        "${userPrompt}"

        ### CURRENT HTML (May include <script> tags) ###
        ${html}

        ### CURRENT CSS ###
        ${css}

        ### TASK & JAVASCRIPT RULES ###
        1. Apply the user's instructions to the HTML and CSS intelligently.
        2. Maintain the #website-root wrapper and global CSS resets.
        3. CRITICAL: Maintain Vercel/Linear level aesthetics. If adding elements, ensure they have massive whitespace, ultra-subtle borders, and soft \`ease-out-expo\` transitions (\`cubic-bezier(0.16, 1, 0.3, 1)\`). NO bouncy/wobbly animations.
        4. If the user asks for interactivity (e.g., "Add a dark mode toggle button"), generate the required HTML button, the CSS styles for the toggle state, AND the vanilla JavaScript inside a \`<script>\` tag at the bottom of the HTML output to make it function.
        5. If there is an existing \`<script>\` tag, preserve it or update it as necessary.
        6. Output the COMPLETE updated HTML and COMPLETE updated CSS.

        Generate the response strictly as a JSON object containing EXACTLY two keys:
        1. "html": The complete updated HTML (including any <script> tags).
        2. "css": The complete updated CSS.

        Return ONLY the raw JSON object. Do not include markdown formatting like \`\`\`json.
    `;

    try {
        const result = await generateWithFallback(aiPrompt);
        let textResponse = result.response.text();
        
        const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error("AI Edit Output did not contain JSON:", textResponse);
            throw new Error("No JSON object found in response");
        }
        
        try {
            const parsedData = JSON.parse(jsonMatch[0]);
            res.status(200).json({ html: parsedData.html, css: parsedData.css });
        } catch (parseError) {
            console.error("Failed to parse JSON. Extracted string:", jsonMatch[0]);
            console.error("Parse Error Details:", parseError.message);
            throw parseError;
        }
    } catch (error) {
        console.error('AI Edit Error:', error.message || error);
        res.status(500).json({ error: 'Failed to apply edits via AI.' });
    }
});

module.exports = router;