const OpenAI = require('openai');

class AIService {
    constructor() {
        // Initialize OpenAI with API key from environment
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
    }

    // Check if AI service is configured
    static isConfigured() {
        return !!process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here';
    }

    // Summarize messages from a room
    async summarizeMessages(messages, roomName = 'Unknown Room') {
        try {
            if (!AIService.isConfigured()) {
                throw new Error('OpenAI API key not configured');
            }

            // Filter only text messages and exclude AI messages
            const textMessages = messages
                .filter(msg => msg.type === 'text' && !msg.isAI)
                .map(msg => `${msg.user?.username || 'Unknown'}: ${msg.content}`)
                .slice(-20); // Only use last 20 messages for context

            if (textMessages.length === 0) {
                return "No text messages to summarize in this room.";
            }

            const conversationText = textMessages.join('\n');

            const prompt = `Please provide a concise summary of the following chat conversation from the room "${roomName}":

${conversationText}

Summary guidelines:
- Keep it under 200 words
- Highlight main topics discussed
- Mention key participants if relevant
- Focus on important information and decisions
- Use a friendly, conversational tone

Please follow below format :
In the "$roomName", participants mainly exchanged greetings like $greetings and $greetings. $someuser talk or ask about $something, and the other replied with $response. The chat was $vibes and mainly speakingabout about $topic. The conversation included participants like $participants, who contributed to the discussion by $contribution. Overall, the chat was friendly and focused on $main_topic.`;

            const completion = await this.openai.chat.completions.create({
                model: "gpt-4.1-nano",
                messages: [
                    {
                        role: "system",
                        content: "You are a helpful assistant that summarizes chat conversations. Be concise but informative."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 250,
                temperature: 0.7
            });

            return completion.choices[0].message.content.trim();
        } catch (error) {
            console.error('AI Summarization Error:', error);
            throw error;
        }
    }

    // Generate fallback summary when AI is not available
    static generateFallbackSummary(messages, roomName = 'Unknown Room') {
        const textMessages = messages.filter(msg => msg.type === 'text' && !msg.isAI);

        if (textMessages.length === 0) {
            return "No messages to summarize in this room.";
        }

        const messageCount = textMessages.length;
        const participants = [...new Set(textMessages.map(msg => msg.user?.username).filter(Boolean))];
        const recentMessages = textMessages.slice(-5);

        let summary = `📊 **Room Summary for ${roomName}**\n\n`;
        summary += `💬 **${messageCount}** messages from **${participants.length}** participants\n`;
        summary += `👥 **Active users**: ${participants.join(', ')}\n\n`;
        summary += `📝 **Recent activity**:\n`;

        recentMessages.forEach((msg, index) => {
            const preview = msg.content.length > 50 ? msg.content.substring(0, 50) + '...' : msg.content;
            summary += `${index + 1}. ${msg.user?.username}: ${preview}\n`;
        });

        summary += `\n*Note: This is a basic summary. Configure OpenAI API for AI-powered summaries.*`;

        return summary;
    }
}

module.exports = AIService;
