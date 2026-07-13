import { h, render } from 'https://esm.sh/preact@10';
import { useState, useEffect, useMemo } from 'https://esm.sh/preact@10/hooks';
import htm from 'https://esm.sh/htm@3';

const html = htm.bind(h);

function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'bot', text: 'Hi! I\'m Volley AI. I\'m an expert on USA Volleyball, SRVA, and Mid TN VBC. How can I help you today?' }
    ]);
    const [input, setInput] = useState('');
    const [kb, setKb] = useState(null);
    const [isTyping, setIsTyping] = useState(false);
    const [activeSection, setActiveSection] = useState('');

    useEffect(() => {
        const loadKb = () => {
            try {
                const override = localStorage.getItem('midtn_kb_override');
                if (override) {
                    setKb(JSON.parse(override));
                    return;
                }
            } catch (e) {
                console.error('Error reading kb override:', e);
            }

            const path = window.location.pathname;
            const kbPath = (path.includes('tryouts') || path.endsWith('/tryouts/index.html')) ? '../volley_kb.json' : './volley_kb.json';

            fetch(kbPath)
                .then(res => res.json())
                .then(data => setKb(data))
                .catch(err => console.error('Error loading knowledge base:', err));
        };

        loadKb();

        // Listen for storage changes from the admin page
        const handleStorage = (e) => {
            if (e.key === 'midtn_kb_override') {
                loadKb();
            }
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, []);

    useEffect(() => {
        const path = window.location.pathname;
        if (path.includes('tryouts') || path.endsWith('/tryouts/index.html')) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    setActiveSection(entry.target.id);
                }
            });
        }, { threshold: 0.3 });

        const sections = ['vision', 'news', 'programs', 'whyplayclub', 'recruiting', 'staff', 'facility', 'sponsors', 'tryouts', 'faq'];
        sections.forEach(id => {
            const el = document.getElementById(id);
            if (el) observer.observe(el);
        });

        return () => observer.disconnect();
    }, []);

    const pageContext = useMemo(() => {
        const path = window.location.pathname;
        if (path.includes('tryouts')) return 'Tryout Manager';
        if (activeSection) {
            const labels = {
                vision: 'Vision & Values',
                news: 'Latest News',
                programs: 'Club Programs',
                whyplayclub: 'Why Play Club?',
                recruiting: 'Recruiting Hub',
                staff: 'Staff & Leadership',
                facility: 'Our Facilities',
                sponsors: 'Official Sponsors',
                tryouts: 'Tryout Information',
                faq: 'FAQ'
            };
            return `Home Page - ${labels[activeSection] || activeSection}`;
        }
        return 'Club Home Page';
    }, [activeSection]);

    const pageDescription = useMemo(() => {
        if (pageContext === 'Tryout Manager') {
            return 'This page is for coaches and staff to manage athlete check-ins, physical testing, and evaluations.';
        }
        if (activeSection === 'tryouts') return 'You are viewing the 2026-2027 tryout dates and registration links.';
        if (activeSection === 'programs') return 'You are looking at our Elite, Regional, and Youth development programs.';
        if (activeSection === 'whyplayclub') return 'This section explains the commitment and benefits of club volleyball.';
        if (activeSection === 'facility') return 'Information about Hooptown and Sportscom training locations.';

        return 'This is the main club home page. You can find information about our programs, news, facilities, and upcoming tryouts here.';
    }, [pageContext, activeSection]);

    const handleSend = async () => {
        if (!input.trim()) return;
        const userQuery = input.trim();
        const q = userQuery.toLowerCase();

        setMessages(prev => [...prev, { role: 'user', text: userQuery }]);
        setInput('');
        setIsTyping(true);

        const fallbackText = "I'm sorry, I don't have that specific information. Please check midtnvbc.com or email info@midtnvbc.com for more details.";
        let response = fallbackText;

        // 1. Get Chatbot Settings
        let settings = { provider: 'rag', apiKey: '', modelName: '' };
        try {
            const rawSettings = localStorage.getItem('midtn_chatbot_settings');
            if (rawSettings) settings = JSON.parse(rawSettings);
        } catch (e) {}

        const useApi = settings.apiKey && (settings.provider === 'gemini' || settings.provider === 'openai');

        if (useApi) {
            try {
                // Construct RAG system prompt with all context
                let systemPrompt = "You are Volley AI, an expert chatbot helper for Mid TN Volleyball Club (Mid TN VBC), USA Volleyball (USAV), and SRVA.\n";
                systemPrompt += "Use the following context to answer the user's question. Be helpful, clear, and concise.\n\n";
                
                if (kb) {
                    if (kb.club_info) {
                        systemPrompt += `Club Info:\nName: ${kb.club_info.name}\nFacility: ${kb.club_info.facility}\nWebsite: ${kb.club_info.website}\n\n`;
                    }
                    if (kb.rules_and_regulations) {
                        systemPrompt += `USAV Rule Highlights: ${kb.rules_and_regulations.usa_volleyball?.expert_note}\n`;
                        systemPrompt += `SRVA Policy Highlights: ${kb.rules_and_regulations.srva?.expert_note}\n\n`;
                    }
                    if (kb.faq && kb.faq.length > 0) {
                        systemPrompt += "Frequently Asked Questions:\n";
                        kb.faq.forEach(f => {
                            systemPrompt += `Q: ${f.question}\nA: ${f.answer}\n`;
                        });
                        systemPrompt += "\n";
                    }
                    if (kb.active_documents && kb.active_documents.length > 0) {
                        systemPrompt += "Website Scraped Content:\n";
                        kb.active_documents.forEach(doc => {
                            systemPrompt += `Page "${doc.name}" (URL: ${doc.url}):\n${doc.content.substring(0, 1000)}\n\n`;
                        });
                    }
                }
                systemPrompt += "Citation Rule: If your answer draws from the 'Website Scraped Content', always cite the source page name and the exact URL provided in the context.\n";
                systemPrompt += "If the context doesn't contain the answer, say exactly: \"I'm sorry, I don't have that specific information. Please check midtnvbc.com or email info@midtnvbc.com for more details.\"";

                if (settings.provider === 'gemini') {
                    const model = settings.modelName || 'gemini-1.5-flash';
                    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${settings.apiKey}`;
                    const res = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{
                                role: 'user',
                                parts: [{ text: `${systemPrompt}\n\nUser Question: ${userQuery}` }]
                            }]
                        })
                    });
                    if (res.ok) {
                        const data = await res.json();
                        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (text) response = text.trim();
                    }
                } else if (settings.provider === 'openai') {
                    const model = settings.modelName || 'gpt-4o-mini';
                    const url = 'https://api.openai.com/v1/chat/completions';
                    const res = await fetch(url, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${settings.apiKey}`
                        },
                        body: JSON.stringify({
                            model: model,
                            messages: [
                                { role: 'system', content: systemPrompt },
                                { role: 'user', content: userQuery }
                            ]
                        })
                    });
                    if (res.ok) {
                        const data = await res.json();
                        const text = data.choices?.[0]?.message?.content;
                        if (text) response = text.trim();
                    }
                }
            } catch (err) {
                console.error("API Chatbot failed, falling back to Client-side RAG:", err);
            }
        }

        const stopWords = new Set(['what', 'where', 'when', 'how', 'who', 'why', 'does', 'have', 'with', 'about', 'from', 'your', 'this', 'that', 'they', 'them', 'their']);

        // 2. Offline Client-side RAG Engine (runs as fallback, or if no API settings are configured)
        if (response === fallbackText && kb) {
            // 0. Priority "Expert Rule" match
            if (q.includes('rule') || q.includes('jewelry') || q.includes('libero') || q.includes('medical form') || q.includes('re-serve') || q.includes('captain')) {
                if (q.includes('srva') || q.includes('medical') || q.includes('notar')) {
                    response = kb.rules_and_regulations?.srva?.expert_note || response;
                } else {
                    response = kb.rules_and_regulations?.usa_volleyball?.expert_note || response;
                }
                if (kb.rules_and_regulations?.highlights) {
                    const hMatch = kb.rules_and_regulations.highlights.find(h => {
                        const hl = h.toLowerCase();
                        return (q.includes('libero') && hl.includes('libero')) ||
                               (q.includes('jewelry') && hl.includes('jewelry')) ||
                               (q.includes('re-serve') && hl.includes('re-serve')) ||
                               (q.includes('uniform') && hl.includes('uniform')) ||
                               (q.includes('medical') && hl.includes('medical'));
                    });
                    if (hMatch) response = hMatch;
                }
            }

            // FAQ direct matches
            if (response === fallbackText && (q.includes('cost') || q.includes('price') || q.includes('how much'))) {
                response = kb.faq?.find(f => f.question.toLowerCase().includes('cost'))?.answer || response;
            } else if (response === fallbackText && (q.includes('sign in') || q.includes('check in') || q.includes('register'))) {
                response = kb.faq?.find(f => f.question.toLowerCase().includes('sign in'))?.answer || response;
            } else if (response === fallbackText && (q.includes('bring') || q.includes('ready') || q.includes('requirement'))) {
                response = kb.faq?.find(f => f.question.toLowerCase().includes('ready'))?.answer || response;
            } else if (response === fallbackText && (q.includes('rule') || q.includes('regulation') || q.includes('uniform'))) {
                response = `USAV Expert Note: ${kb.rules_and_regulations?.usa_volleyball?.expert_note || ''}`;
            } else if (response === fallbackText && q.includes('srva')) {
                response = `SRVA Expert Note: ${kb.rules_and_regulations?.srva?.expert_note || ''}`;
            } else if (response === fallbackText && (q.includes('news') || q.includes('update'))) {
                if (kb.news && kb.news[0]) {
                    response = `Latest News: ${kb.news[0].title} (${kb.news[0].date}). ${kb.news[0].summary}`;
                }
            } else if (q.includes('social') || q.includes('instagram') || q.includes('facebook')) {
                response = `Social Media Updates: (IG) ${kb.social_updates?.instagram} (FB) ${kb.social_updates?.facebook}`;
            } else if (q.includes('where') || q.includes('location') || q.includes('facility') || q.includes('hooptown') || q.includes('sportscom')) {
                response = `We are based at Hooptown in Smyrna, TN (6910 Stroop Ln). We also have a beach program at Sportscom in Murfreesboro.`;
            } else if (q.includes('offer') || q.includes('when will we know')) {
                response = kb.faq?.find(f => f.question.toLowerCase().includes('offers'))?.answer || "Initial offers are typically made within 24-48 hours after the conclusion of tryouts for your age group via email/SportsEngine.";
            } else if (q.includes('sponsor') || q.includes('cerina') || q.includes('shane')) {
                response = kb.faq?.find(f => f.question.toLowerCase().includes('sponsor'))?.answer || response;
            } else if (q.includes('program') || q.includes('tots') || q.includes('jrs') || q.includes('youth') || q.includes('league')) {
                response = kb.faq?.find(f => f.question.toLowerCase().includes('program'))?.answer || response;
            }

            // Custom trained FAQ match scan
            if (response === fallbackText && kb.faq && kb.faq.length > 0) {
                let bestFaq = null;
                let bestFaqScore = 0;
                for (const faq of kb.faq) {
                    const faqQ = faq.question.toLowerCase();
                    if (faqQ.includes(q) || q.includes(faqQ)) {
                        response = faq.answer;
                        break;
                    }
                    const words = q.split(/[^a-zA-Z0-9]/)
                                   .map(w => w.trim())
                                   .filter(w => w.length > 3 && !stopWords.has(w));
                    let score = 0;
                    for (const w of words) {
                        if (faqQ.includes(w)) score++;
                    }
                    if (score > bestFaqScore) {
                        bestFaqScore = score;
                        bestFaq = faq;
                    }
                }
                if (response === fallbackText && bestFaq && bestFaqScore >= 1) {
                    response = bestFaq.answer;
                }
            }

            // Smart Client-side RAG document scorer
            if (response === fallbackText && kb.active_documents && kb.active_documents.length > 0) {
                let bestMatch = null;
                let bestScore = 0;
                
                const keywords = q.split(/[^a-zA-Z0-9]/)
                                  .map(w => w.trim())
                                  .filter(w => w.length > 3 && !stopWords.has(w));
                                  
                if (keywords.length > 0) {
                    for (const doc of kb.active_documents) {
                        const passages = doc.content.split(/[.\n]+/);
                        for (const passage of passages) {
                            const cleanPassage = passage.trim();
                            if (cleanPassage.length < 20) continue;
                            
                            const passageLower = cleanPassage.toLowerCase();
                            let score = 0;
                            for (const kw of keywords) {
                                if (passageLower.includes(kw)) {
                                    score += 1;
                                }
                            }
                            if (score > bestScore) {
                                bestScore = score;
                                bestMatch = { text: cleanPassage, docName: doc.name, url: doc.url };
                            }
                        }
                    }
                }
                
                const minScore = Math.min(2, keywords.length);
                if (bestMatch && bestScore >= minScore) {
                    response = `From "${bestMatch.docName}": "${bestMatch.text}." For more details, visit: ${bestMatch.url}`;
                }
            }
        }

        if (q.includes('where am i') || q.includes('page') || q.includes('current section')) {
            response = `You are currently on the ${pageContext}. ${pageDescription}`;
        } else if (pageContext === 'Tryout Manager' && (q.includes('sign in') || q.includes('station'))) {
            response = "On this page, you can manage athlete check-ins and test results. Head Coach PIN is 0000, Staff is 1111, Check-In is 9999, and Station 2 is 2222.";
        }

        // 3. Log Unanswered Query for Training
        if (response === fallbackText) {
            try {
                const key = 'midtn_unanswered_questions';
                const current = JSON.parse(localStorage.getItem(key) || '[]');
                if (!current.some(item => item.question.toLowerCase() === q.trim().toLowerCase())) {
                    current.push({
                        id: `q-${Date.now()}-${Math.random().toString(36).substr(2,4)}`,
                        question: userQuery,
                        timestamp: new Date().toISOString(),
                    });
                    localStorage.setItem(key, JSON.stringify(current));
                    window.dispatchEvent(new StorageEvent('storage', { key, newValue: JSON.stringify(current) }));
                }
            } catch (e) {
                console.error("Error logging unanswered query:", e);
            }
        }

        setMessages(prev => [...prev, { role: 'bot', text: response }]);
        setIsTyping(false);
    };

    return html`
        <div style=${{ fontFamily: 'Inter, sans-serif' }}>
            ${!isOpen && html`
                <button onClick=${() => setIsOpen(true)} id="volley-ai-trigger" style=${{
                    width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#f0a500',
                    border: 'none', color: '#000', fontSize: '24px', cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>🏐</button>
            `}
            ${isOpen && html`
                <div id="chatbot-window" style=${{
                    width: '350px', height: '450px', backgroundColor: '#1a1d24', border: '1px solid #2a2e38',
                    borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                }}>
                    <div style=${{
                        padding: '12px 16px', backgroundColor: '#f0a500', color: '#000', fontWeight: 'bold',
                        display: 'flex', justifySelf: 'stretch', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                        <span>Volley AI Expert</span>
                        <button onClick=${() => setIsOpen(false)} style=${{
                            background: 'none', border: 'none', color: '#000', fontSize: '20px', cursor: 'pointer'
                        }}>×</button>
                    </div>
                    <div style=${{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style=${{ fontSize: '11px', color: '#78909c', textAlign: 'center', marginBottom: '8px' }}>
                            <strong>Context:</strong> ${pageContext}<br/>
                            <span style=${{ fontSize: '10px' }}>${pageDescription}</span>
                        </div>
                        ${messages.map(m => html`
                            <div style=${{
                                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                                backgroundColor: m.role === 'user' ? '#f0a500' : '#2a2e38',
                                color: m.role === 'user' ? '#000' : '#e8eaed',
                                padding: '8px 12px', borderRadius: '8px', maxWidth: '80%', fontSize: '13px'
                            }}>${m.text}</div>
                        `)}
                        ${isTyping && html`
                            <div style=${{
                                alignSelf: 'flex-start',
                                backgroundColor: '#2a2e38',
                                color: '#78909c',
                                padding: '8px 12px', borderRadius: '8px', fontSize: '13px', fontStyle: 'italic'
                            }}>Typing...</div>
                        `}
                    </div>
                    <div style=${{ padding: '12px', borderTop: '1px solid #2a2e38', display: 'flex', gap: '8px' }}>
                        <input value=${input} onInput=${(e) => setInput(e.target.value)}
                                onKeyDown=${(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Ask about rules, tryouts, etc..."
                                style=${{
                                    flex: 1, backgroundColor: '#12151c', border: '1px solid #2a2e38',
                                    color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '13px'
                                }} />
                        <button onClick=${handleSend} style=${{
                            backgroundColor: '#f0a500', border: 'none', padding: '8px 12px', borderRadius: '6px', cursor: 'pointer'
                        }}>Send</button>
                    </div>
                </div>
            `}
        </div>
    `;
}

render(html`<${Chatbot} />`, document.getElementById('chatbot-root'));
