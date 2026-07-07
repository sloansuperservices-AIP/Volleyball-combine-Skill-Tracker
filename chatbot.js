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
        const userQuery = input.toLowerCase();
        setInput('');

        setTimeout(() => {
            let response = "I'm sorry, I don't have that specific information. Please check midtnvbc.com or email info@midtnvbc.com for more details.";

            if (kb) {
                // 1. Check FAQs first (Source of truth for direct club questions)
                const faqMatch = kb.faq?.find(f => userQuery.includes(f.question.toLowerCase()) ||
                                                  (userQuery.includes('cost') && f.question.toLowerCase().includes('cost')) ||
                                                  (userQuery.includes('sign in') && f.question.toLowerCase().includes('sign in')) ||
                                                  (userQuery.includes('ready') && f.question.toLowerCase().includes('ready')));

                if (faqMatch) {
                    response = faqMatch.answer;
                }
                // 2. Specific Keyword Handlers
                else if (userQuery.includes('offer') || userQuery.includes('when will we know')) {
                    response = "Initial offers are typically made within 24-48 hours after the conclusion of tryouts for your age group via email/SportsEngine.";
                }
                else if (userQuery.includes('rule') || userQuery.includes('regulation') || userQuery.includes('jewelry') || userQuery.includes('captain')) {
                    response = `USAV Expert Note: ${kb.rules_and_regulations?.usa_volleyball?.expert_note || "Please check the USAV rulebook."}`;
                }
                else if (userQuery.includes('srva') || userQuery.includes('membership')) {
                    response = `SRVA Expert Note: ${kb.rules_and_regulations?.srva?.expert_note || "All participants must have a valid SRVA/USAV membership."}`;
                }
                else if (userQuery.includes('news') || userQuery.includes('update')) {
                    if (kb.news && kb.news.length > 0) {
                        const latest = kb.news[0];
                        response = `Latest Update (${latest.date}): ${latest.title}. ${latest.summary}`;
                    }
                }
                else if (userQuery.includes('social') || userQuery.includes('instagram') || userQuery.includes('facebook')) {
                    response = `Social Media: (IG) ${kb.social_updates?.instagram || "@midtnvbc"} (FB) ${kb.social_updates?.facebook || "Mid TN VBC"}`;
                }
                else if (userQuery.includes('where') || userQuery.includes('location') || userQuery.includes('facility') || userQuery.includes('hooptown')) {
                    response = `We are based at Hooptown in Smyrna (6910 Stroop Ln) and offer beach programs at Sportscom in Murfreesboro.`;
                }
                else if (userQuery.includes('sponsorship') || userQuery.includes('sponsor')) {
                    response = "Our official club sponsors are Cerina Craig (Real Estate) and Shane Electric. We thank them for their support!";
                }

                // 3. Fallback to searching news/rules titles if no direct match
                if (response.startsWith("I'm sorry")) {
                    const newsMatch = kb.news?.find(n => userQuery.split(' ').some(word => word.length > 3 && n.title.toLowerCase().includes(word)));
                    if (newsMatch) {
                        response = `Found in News: ${newsMatch.title} - ${newsMatch.summary}`;
                    }
                }
            }

            if (userQuery.includes('where am i') || userQuery.includes('page') || userQuery.includes('current section')) {
                response = `You are currently on the ${pageContext}. I can help you with questions specific to this area!`;
                // Specific Query Handling
                if (q.includes('cost') || q.includes('price') || q.includes('how much')) {
                    response = kb.faq?.find(f => f.question.toLowerCase().includes('cost'))?.answer || response;
                } else if (q.includes('sign in') || q.includes('check in') || q.includes('register')) {
                    response = kb.faq?.find(f => f.question.toLowerCase().includes('sign in'))?.answer || response;
                } else if (q.includes('bring') || q.includes('ready') || q.includes('requirement')) {
                    response = kb.faq?.find(f => f.question.toLowerCase().includes('ready'))?.answer || response;
                } else if (q.includes('sponsor') || q.includes('craig') || q.includes('shane')) {
                    response = kb.faq?.find(f => f.question.toLowerCase().includes('sponsor'))?.answer || response;
                } else if (q.includes('rule') || q.includes('regulation') || q.includes('uniform')) {
                    response = `USAV Expert Note: ${kb.rules_and_regulations.usa_volleyball.expert_note}`;
                } else if (q.includes('srva')) {
                    response = `SRVA Expert Note: ${kb.rules_and_regulations.srva.expert_note}`;
                } else if (q.includes('news') || q.includes('update')) {
                    if (kb.news && kb.news[0]) {
                        response = `Latest News: ${kb.news[0].title} (${kb.news[0].date}). ${kb.news[0].summary}`;
                    }
                } else if (q.includes('social') || q.includes('instagram') || q.includes('facebook')) {
                    response = `Social Media Updates: (IG) ${kb.social_updates?.instagram} (FB) ${kb.social_updates?.facebook}`;
                } else if (q.includes('where') || q.includes('location') || q.includes('facility') || q.includes('hooptown') || q.includes('sportscom')) {
                    response = `We train at Hooptown (6910 Stroop Ln, Smyrna) and Sportscom (2310 Memorial Blvd, Murfreesboro) for beach programs.`;
                } else if (q.includes('program') || q.includes('tots') || q.includes('jrs') || q.includes('academy')) {
                    response = `We offer Volley Tots (Ages 4-8), Volley Jrs (Ages 9-13), and League/Academy programs combining training and match play.`;
                }
            }

            if (q.includes('where am i') || q.includes('page') || q.includes('current section')) {
                response = `You are currently on the ${pageContext}. ${pageContext === 'Tryout Manager' ? 'This page is for coaches and staff to manage athlete check-ins and evaluations.' : 'This is our main club hub for news, programs, and general info.'}`;
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
