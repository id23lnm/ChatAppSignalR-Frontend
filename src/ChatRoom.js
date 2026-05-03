import React, { useRef, useEffect } from 'react';
import PropTypes from 'prop-types';

const ChatRoom = ({ usermessages }) => {
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [usermessages]);

    return (
        <div className="h-screen p-4 overflow-y-scroll bg-white rounded-lg shadow-lg">
            {usermessages.map((msg, index) => (
                <div key={index} className={`mb-2 p-2 rounded ${msg.isSystem ? 'bg-gray-200' : 'bg-blue-200'}`}>
                    <strong>{msg.user}: </strong>{msg.message}
                </div>
            ))}
            <div ref={messagesEndRef} />
        </div>
    );
};

ChatRoom.propTypes = {
    usermessages: PropTypes.arrayOf(
        PropTypes.shape({
            user: PropTypes.string.isRequired,
            message: PropTypes.string.isRequired
        })
    ).isRequired
};

export default ChatRoom;