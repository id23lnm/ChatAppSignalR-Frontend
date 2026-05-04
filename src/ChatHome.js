import React, { useState, useEffect } from 'react';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import ChatRoom from './ChatRoom';
import ChatBox from './ChatBox';

const ChatHome = () => {
    const [connection, setConnection] = useState(null); // Save SignalR-connection
    const [usermessages, setUserMessages] = useState([]); // List of all messages
    const [userName, setUserName] = useState(''); // Input from user
    const [chatRoom, setChatRoom] = useState(''); // Input from user
    const [loading, setLoading] = useState(false); // Show "connecting" when joining

    // Listen to the server
    useEffect(() => {

        // Runs when connection changes (i.e when you connect)
        if (connection) {
            // Listen to messages, match backend "SendAsync("ReceiveMessage", userName, message)"
            connection.on("ReceiveMessage", (user, message) => {

                // Add new messages in the list, keeps the 10 most recent, automatically deletes the oldest
                setUserMessages(prevMessages => {
                    const updated = [...prevMessages, { user, message }];

                    return updated.slice(-10);
                });
            });

            // When connection close
            connection.onclose(() => {
                console.log("Connection closed");
            });
        }
    }, [connection]);

    const joinChatRoom = async (userName, chatRoom) => {
        setLoading(true);

        // Creates a SignalR-connection
        const connection = new HubConnectionBuilder()
            .withUrl("https://localhost:7073/chat")
            .configureLogging(LogLevel.Information)
            .build();

        // Start a WebSocket-connection
        await connection.start();

        // Calling backend method "public async Task JoinChatRoom(...)"
        await connection.invoke("JoinChatRoom", userName, chatRoom);

        // Save connection, triggers userEffect
        setConnection(connection);
        setLoading(false);
    };

    const sendMessage = async (message) => {
        if (connection) {

            // Calling "SendMessage(...)"
            await connection.invoke("SendMessage", chatRoom, userName, message);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-900">
            <main className="container flex-grow mx-auto">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-white">Connecting to chat room...</p>
                    </div>
                ) : (
                    connection ? (
                        <>
                            <ChatRoom usermessages={usermessages} />
                            <ChatBox sendMessage={sendMessage} />
                        </>
                    ) : (
                        <div className="flex items-center justify-center min-h-screen bg-gray-900">
                            <div className="w-full max-w-lg p-8 mx-4 bg-white rounded-lg shadow-lg md:mx-auto">
                                <input
                                    type="text"
                                    placeholder="Enter your name"
                                    value={userName}
                                    onChange={(e) => setUserName(e.target.value)}
                                />
                                <input
                                    type="text"
                                    placeholder="Enter chat room name"
                                    value={chatRoom}
                                    onChange={(e) => setChatRoom(e.target.value)}
                                />
                                <button onClick={() => joinChatRoom(userName, chatRoom)}>Join Chat Room</button>
                            </div>
                        </div>
                    )
                )}
            </main>
        </div>
    );
};

export default ChatHome;