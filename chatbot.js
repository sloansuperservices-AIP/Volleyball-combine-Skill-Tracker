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
        // Calculate the base path to ensure it works when deployed in subdirectories (like GitHub Pages)
        const isTryouts = window.location.pathname.includes('tryouts');
        const kbPath = isTryouts ? '../volley_kb.json' : './volley_kb.json';

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

        // Simple response logic based on KB
        setTimeout(() => {
            let response = "I'm sorry, I don't have that information. Please check MIDVBC.com or follow @Midtvbc for more details.";
            const q = input.toLowerCase();

            if (kb) {
                const findFaq = (key) => kb.faq?.find(f => f.question.toLowerCase().includes(key))?.answer;
                const findNews = (key) => kb.news?.find(n => n.title.toLowerCase().includes(key))?.summary;

                if (q.includes('sign in') || q.includes('tryout')) {
                    response = findFaq('sign in') || response;
                } else if (q.includes('cost') || q.includes('price')) {
                    response = findFaq('cost') || response;
                } else if (q.includes('ready') || q.includes('bring')) {
                    response = findFaq('ready') || response;
                } else if (q.includes('news') || q.includes('update')) {
                    response = kb.news?.[0] ? `Latest News: ${kb.news[0].title}. ${kb.news[0].summary}` : response;
                } else if (q.includes('usa volleyball') || q.includes('rule') || q.includes('regulation')) {
                    response = kb.rules_and_regulations?.usa_volleyball?.expert_note || response;
                } else if (q.includes('srva')) {
                    response = kb.rules_and_regulations?.srva?.expert_note || response;
                } else if (q.includes('janae')) {
                    response = findNews('janae') || response;
                } else if (q.includes('website') || q.includes('url')) {
                    response = kb.club_info?.website ? `Our official website is ${kb.club_info.website}.` : response;
                } else if (q.includes('instagram') || q.includes('social')) {
                    response = (kb.club_info?.social_media?.instagram) ? `Follow us on Instagram at ${kb.club_info.social_media.instagram} (@Midtvbc) and Facebook at ${kb.club_info.social_media.facebook}.` : response;
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
                <button onClick=${() => setIsOpen(true)} style=${{
                    width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#f0a500',
                    border: 'none', color: '#000', fontSize: '24px', cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>🏐</button>
            `}
            ${isOpen && html`
                <div style=${{
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
