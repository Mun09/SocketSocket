import React, { useEffect, useState } from 'react';

const Chat = () => {
    const [socket, setSocket] = useState(null);
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);
    const [clientId, setClientId] = useState(0);

    useEffect(() => {
        const ws = new WebSocket('ws://localhost:8000/ws/');
        ws.onopen = () => {
            console.log('Connected to the server');
        }
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            setClientId(data.client_id);
        }

        ws.onclose = () => {
            console.log('Disconnected from the server')
        }


        setSocket(ws);

        return () => {
            ws.close()
        }
    },[])

    useEffect(() => {
        if (!socket) return;
    
        socket.onmessage = (event) => {
            console.log(event.data);
            const message = event.data;
            setMessages((prevMessages) => [...prevMessages, message]);
        };
    
        return () => {
          socket.onmessage = null;
        };
      }, [socket]
    );

    const sendMessage = () => {
        if(socket && message) {
            socket.send(JSON.stringify({ client_id: clientId, message }));
            setMessage('');
        }
    }

    const handleKeyDown = (event) => {
        if (event.key === 'Enter') {
          sendMessage();
        }
      };

    return (
        <div>
            <h1>WebSocket Chat</h1>
            <div>
                {messages.map((msg, index) => (
                    <div key={index}>{msg}</div>
                ))}
            </div>
            <input
                type='text'
                value={message}
                onChange={(e)=>setMessage(e.target.value)}
                onKeyDown={handleKeyDown}
            ></input>
            <button onClick={sendMessage}>Send</button>
        </div>
    )
}

export default Chat