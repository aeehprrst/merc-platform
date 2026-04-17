import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

// 1. Initialize Gemini with your secret key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    // 2. Receive the item details from your frontend
    const { title, description, imageUrl } = await req.json();

    // 3. Fetch the uploaded image from Supabase and convert it for the AI
    const imageResponse = await fetch(imageUrl);
    const arrayBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';

    // 4. Load the lightning-fast Gemini 1.5 Flash vision model
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // 5. The Bouncer's Rulebook (The Prompt)
    const prompt = `
      You are the final safety bouncer for a university marketplace. 
      Your ONLY job is to flag strictly illegal or highly dangerous items.

      Item Title: "${title}"
      Item Description: "${description}"

      RULES:
      1. APPROVE ALMOST EVERYTHING. Electronics, gaming mice, laptops, bicycles, clothes, furniture, and study materials are 100% ALLOWED.
      2. IGNORE whether the image perfectly matches the text.
      3. REJECT ONLY IF you clearly see or read about:
         - Drugs, alcohol, cigarettes, or vapes.
         - Weapons (guns, knives, explosives).
         - Explicit or adult content.
      
      If it is a normal, legal item, respond ONLY with "APPROVED".
      If it is strictly illegal, respond with "REJECTED: [short reason]".
    `;

    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: mimeType,
      },
    };

    // 🚨 THE ULTIMATE BYPASS: Auto-approve tech, books, and common campus items
    const lowerTitle = title.toLowerCase();
    const autoApproveWords = [
      'book', 'math', 'notes', 'calculator', // Academics
      'mouse', 'keyboard', 'laptop', 'phone', 'gaming', 'pc', 'earbuds', 'headphones', 'monitor', // Tech
      'bicycle', 'cycle', 'bike', 'bag', 'bottle', 'clothes', 'shoes' // Everyday items
    ];
    
    const isAutoSafe = autoApproveWords.some(word => lowerTitle.includes(word));
    
    if (isAutoSafe) {
      console.log(`Auto-approving safe item: ${title}`);
      return NextResponse.json({ verdict: "APPROVED", reason: "Auto-approved safe category" });
    }

    // If it's not in the bypass list, ask the AI
    const result = await model.generateContent([prompt, imagePart]);
    const fullResponse = result.response.text().trim().toUpperCase();
    
    console.log(`AI Raw Response for "${title}":`, fullResponse); 

    // 🚨 BULLETPROOF PARSING: Use .includes() instead of .startsWith()
    const isApproved = fullResponse.includes("APPROVED");
    const verdict = isApproved ? "APPROVED" : "REJECTED";

    return NextResponse.json({ 
      verdict, 
      reason: isApproved ? "" : fullResponse.replace("REJECTED:", "").trim() 
    });

  } catch (error) {
    console.error("AI Moderation Error:", error);
    return NextResponse.json({ error: "Failed to moderate item", verdict: "REJECTED" }, { status: 500 });
  }
}