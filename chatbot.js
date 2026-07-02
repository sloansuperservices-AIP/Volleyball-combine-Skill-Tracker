let kb = null;

async function loadKB() {
    const response = await fetch('knowledge_base.json');
    kb = await response.json();
}

loadKB();

const launcher = document.getElementById('chatbot-launcher');
const windowBox = document.getElementById('chatbot-window');
const closeBtn = document.getElementById('close-chatbot');
const sendBtn = document.getElementById('send-chat');
const input = document.getElementById('chat-input');
const messagesContainer = document.getElementById('chatbot-messages');

launcher.onclick = () => windowBox.classList.toggle('hidden');
closeBtn.onclick = () => windowBox.classList.add('hidden');

function addMessage(text, side) {
    const div = document.createElement('div');
    div.className = `msg ${side}`;
    div.innerText = text;
    messagesContainer.appendChild(div);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

sendBtn.onclick = handleSend;
input.onkeypress = (e) => { if (e.key === 'Enter') handleSend(); };

function handleSend() {
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, 'user');
    input.value = '';

    setTimeout(() => {
        const response = getBotResponse(text);
        addMessage(response, 'bot');
    }, 500);
}

function getBotResponse(query) {
    if (!kb) return "I'm still warming up. Ask me again in a second!";

    query = query.toLowerCase();

    // Context aware check based on current page/scroll
    const scrollPos = window.scrollY;
    const tryoutsSection = document.getElementById('tryouts').offsetTop;

    if (query.includes('cost') || query.includes('price') || query.includes('how much')) {
        return `The tryout cost is ${kb.club_info.tryouts.costs}. Registration is non-refundable.`;
    }

    if (query.includes('tryout') || query.includes('sign in') || query.includes('register')) {
        return `Tryouts for 2026-27 are on ${kb.club_info.tryouts.dates_2026}. You can register at the link in the Tryouts section. Requirements: ${kb.club_info.tryouts.requirements.join(', ')}.`;
    }

    if (query.includes('location') || query.includes('where')) {
        return `Our main training is at ${kb.club_info.location.main}. Beach volleyball is at ${kb.club_info.location.beach}.`;
    }

    if (query.includes('rule') || query.includes('regulation') || query.includes('uniform') || query.includes('number')) {
        return `USAV Rule for uniforms: ${kb.rules.usa_volleyball.uniforms.numbers}. General SRVA Tryout Policy: ${kb.rules.srva.tryout_policies.commitment}`;
    }

    if (query.includes('program') || query.includes('level')) {
        const programs = kb.club_info.programs.map(p => p.name).join(', ');
        return `We offer several programs: ${programs}. Which one would you like to know more about?`;
    }

    if (query.includes('coach')) {
        return "Our coaches are invested in individual development. You can reach Jess Pino, our recruiting coordinator, at Recruiting@midtnvbc.com.";
    }

    return "I'm not sure about that. Try asking about tryouts, costs, locations, or volleyball rules! You can also email us at info@midtnvbc.com.";
}
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

    useEffect(() => {
        // Correctly resolve path to volley_kb.json based on current location
        const path = window.location.pathname;
        const kbPath = (path.includes('tryouts') || path.endsWith('/tryouts')) ? '../volley_kb.json' : './volley_kb.json';

        fetch(kbPath)
            .then(res => res.json())
            .then(data => setKb(data))
            .catch(err => console.error('Error loading knowledge base:', err));
    }, []);

    const pageContext = useMemo(() => {
        const path = window.location.pathname;
        if (path.includes('tryouts')) return 'Tryout Manager';
        return 'Home Page';
    }, []);

    const handleSend = () => {
        if (!input.trim()) return;

        const newMessages = [...messages, { role: 'user', text: input }];
        setMessages(newMessages);
        setInput('');

        setTimeout(() => {
            let response = "I'm sorry, I don't have that specific information. Please check MIDVBC.com or email info@midtnvbc.com for more details.";
            const q = input.toLowerCase();

            if (kb) {
                // Find in FAQ
                const faqMatch = kb.faq?.find(f => {
                    const question = f.question.toLowerCase().replace('?', '');
                    // Priority 1: High overlap or direct inclusion
                    if (q.includes(question) || question.includes(q)) return true;
                    // Priority 2: Key noun matching
                    const keywords = ['cost', 'price', 'fee', 'sign in', 'check in', 'location', 'ready', 'bring', 'paperwork', 'result', 'offer'];
                    return keywords.some(k => q.includes(k) && question.includes(k));
                });

                if (faqMatch) {
                    response = faqMatch.answer;
                } else if (q.includes('rule') || q.includes('regulation') || q.includes('usa volleyball') || q.includes('usav')) {
                    const usav = kb.rules_and_regulations?.usa_volleyball;
                    response = usav ? usav.expert_note : response;
                } else if (q.includes('srva')) {
                    const srva = kb.rules_and_regulations?.srva;
                    response = srva ? srva.expert_note : response;
                } else if (q.includes('news') || q.includes('update')) {
                    response = kb.news?.[0] ? `Latest News: ${kb.news[0].title}. ${kb.news[0].summary}` : response;
                } else if (q.includes('social') || q.includes('instagram') || q.includes('facebook')) {
                    const ig = kb.social_updates?.instagram || "";
                    const fb = kb.social_updates?.facebook || "";
                    response = `Social Media Updates: (IG) ${ig} (FB) ${fb}`;
                } else if (q.includes('cost') || q.includes('price') || q.includes('fee')) {
                    response = kb.faq?.find(f => f.question.toLowerCase().includes('cost'))?.answer || response;
                } else if (q.includes('sign in') || q.includes('check in') || q.includes('location')) {
                    response = kb.faq?.find(f => f.question.toLowerCase().includes('sign in'))?.answer || response;
                } else if (q.includes('result') || q.includes('offer')) {
                    response = kb.faq?.find(f => f.question.toLowerCase().includes('result'))?.answer || response;
                }
            }

            if (q.includes('where am i') || q.includes('page')) {
                response = `You are currently on the ${pageContext}. I can help you with questions specific to this area!`;
            }

            setMessages([...newMessages, { role: 'bot', text: response }]);
        }, 500);
    };

    return html`
        <div style=${{ fontFamily: 'Inter, sans-serif' }}>
            ${!isOpen && html`
                <button onClick=${() => setIsOpen(true)} id="volley-ai-trigger-preact" style=${{
                    width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#f0a500',
                    border: 'none', color: '#000', fontSize: '24px', cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>🏐</button>
            `}
            ${isOpen && html`
                <div id="chatbot-window-preact" style=${{
                    width: '350px', height: '450px', backgroundColor: '#1a1d24', border: '1px solid #2a2e38',
                    borderRadius: '12px', display: 'flex', flexDirection: 'column', overflow: 'hidden',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                }}>
                    <div style=${{
                        padding: '12px 16px', backgroundColor: '#f0a500', color: '#000', fontWeight: 'bold',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                        <span>Volley AI Expert</span>
                        <button onClick=${() => setIsOpen(false)} style=${{
                            background: 'none', border: 'none', color: '#000', fontSize: '20px', cursor: 'pointer'
                        }}>×</button>
                    </div>
                    <div style=${{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style=${{ fontSize: '11px', color: '#78909c', textAlign: 'center', marginBottom: '8px' }}>Context: ${pageContext}</div>
                        ${messages.map(m => html`
                            <div style=${{
                                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                                backgroundColor: m.role === 'user' ? '#f0a500' : '#2a2e38',
                                color: m.role === 'user' ? '#000' : '#e8eaed',
                                padding: '8px 12px', borderRadius: '8px', maxWidth: '80%', fontSize: '13px'
                            }}>${m.text}</div>
                        `)}
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
