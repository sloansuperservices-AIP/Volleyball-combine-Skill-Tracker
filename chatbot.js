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
        const path = window.location.pathname;
        const kbPath = (path.includes('tryouts') || path.endsWith('/tryouts/index.html')) ? '../volley_kb.json' : './volley_kb.json';

        fetch(kbPath)
            .then(res => res.json())
            .then(data => setKb(data))
            .catch(err => console.error('Error loading knowledge base:', err));
    }, []);

    const pageContext = useMemo(() => {
        const path = window.location.pathname;
        if (path.includes('tryouts')) return 'Tryout Manager';
        return 'Club Home Page';
    }, []);

    const handleSend = () => {
        if (!input.trim()) return;

        const newMessages = [...messages, { role: 'user', text: input }];
        setMessages(newMessages);
        setInput('');

        setTimeout(() => {
            let response = "I'm sorry, I don't have that specific information. Please check midtnvbc.com or email info@midtnvbc.com for more details.";
            const q = input.toLowerCase();

            if (kb) {
                // Specific Query Handling
                if (q.includes('cost') || q.includes('price') || q.includes('how much') || q.includes('fee')) {
                    response = kb.faq?.find(f => f.question.toLowerCase().includes('cost'))?.answer || response;
                } else if (q.includes('sign in') || q.includes('check in') || q.includes('arrival')) {
                    response = kb.faq?.find(f => f.question.toLowerCase().includes('sign in'))?.answer || response;
                } else if (q.includes('bring') || q.includes('ready') || q.includes('requirement') || q.includes('paperwork')) {
                    response = kb.faq?.find(f => f.question.toLowerCase().includes('ready'))?.answer || response;
                } else if (q.includes('offer') || q.includes('team') || q.includes('result') || q.includes('when will we know')) {
                    response = kb.faq?.find(f => f.question.toLowerCase().includes('offer'))?.answer || response;
                } else if (q.includes('rule') || q.includes('regulation') || q.includes('uniform') || q.includes('jewelry')) {
                    response = `USAV Expert Note: ${kb.rules_and_regulations.usa_volleyball.expert_note}`;
                } else if (q.includes('srva') || q.includes('membership')) {
                    response = `SRVA Expert Note: ${kb.rules_and_regulations.srva.expert_note}`;
                } else if (q.includes('age') || q.includes('division') || q.includes('born')) {
                    response = `Age Definitions: ${kb.rules_and_regulations.usa_volleyball.age_definitions}`;
                } else if (q.includes('social') || q.includes('instagram') || q.includes('facebook')) {
                    response = `Social Media Highlights:\n(IG) ${kb.social_updates?.instagram?.latest_post}\n(FB) ${kb.social_updates?.facebook?.latest_post}`;
                } else if (q.includes('news') || q.includes('update')) {
                    if (kb.news && kb.news[0]) {
                        response = `Latest News: ${kb.news[0].title} (${kb.news[0].date}). ${kb.news[0].summary}`;
                    }
                } else if (q.includes('where') || q.includes('location') || q.includes('facility') || q.includes('address')) {
                    response = `We are based at Hooptown (Indoor) in Smyrna and Sportscom (Beach) in Murfreesboro. Check the Facilities section on the home page for full addresses.`;
                }
            }

            if (q.includes('where am i') || q.includes('page') || q.includes('current section')) {
                response = `You are currently on the ${pageContext}.`;
                if (pageContext === 'Tryout Manager') {
                    response += " In this section, you can manage athlete check-ins, record station metrics (Physical/Agility), and build teams based on tryout scores.";
                } else {
                    response += " This is our main club site where you can find program details, staff info, and general club news.";
                }
            }

            // Proactive context-based help
            if (q.includes('help') || q.includes('what can you do')) {
                if (pageContext === 'Tryout Manager') {
                    response = "On the Tryout Manager page, I can help you with: PIN codes for stations, how to add walk-up athletes, or interpreting score rankings.";
                } else {
                    response = "On the Home Page, I can help with: Tryout costs, program descriptions (Elite/Regional/Youth), facility locations, or USAV rule updates.";
                }
            }

            setMessages([...newMessages, { role: 'bot', text: response }]);
        }, 500);
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
