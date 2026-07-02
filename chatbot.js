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
