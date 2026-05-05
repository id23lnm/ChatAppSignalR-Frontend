import React, { useState, useEffect } from 'react';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import ChatRoom from './ChatRoom';
import ChatBox from './ChatBox';

const ChatHome = () => {
    const [connection, setConnection] = useState(null); // Save SignalR-connection
    const [usermessages, setUserMessages] = useState([]); // List of all messages
    const [userName, setUserName] = useState(''); // Input from user
    const [chatRoom, setChatRoom] = useState(''); // Input from user
    const [role, setRole] = useState('');
    const [loading, setLoading] = useState(false); // Show "connecting" when joining
    const [announcements, setAnnouncements] = useState([]);

    // Set up SignalR listeners when connection is established
    // Separate events are used for chat messages and announcements
    useEffect(() => {

        // Runs when connection changes
        if (connection) {

            // Handles incoming chat messages (normal chat + system messages)
            connection.on("ReceiveMessage", (user, message, isSystem = false) => {

                // Add new messages in the list, keeps the 10 most recent, automatically deletes the oldest
                setUserMessages(prev => {
                    const updated = [...prev, { user, message, isSystem }];
                    return updated.slice(-10);
                });
            });

            // Handles announcements sent by teachers
            connection.on("ReceiveAnnouncement", (user, message) => {

                // Add new announcements in the list, keeps the 10 most recent, automatically deletes the oldest
                setAnnouncements(prev => {
                    const updated = [...prev, { user, message }];
                    return updated.slice(-10);
                });
            });

            connection.onclose(() => {
                console.log("Connection closed");
            });

            // Cleanup listeners to prevent duplicate messages
            return () => {
                connection.off("ReceiveMessage");
                connection.off("ReceiveAnnouncement");
            };
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
        await connection.invoke("JoinChatRoom", userName, chatRoom, role);

        // Save connection, triggers userEffect
        setConnection(connection);
        setLoading(false);
    };

    const sendMessage = async (message) => {
        if (connection) {
            await connection.invoke("SendMessage", chatRoom, userName, message);
        }
    };

    const sendAnnouncement = async (message) => {
        if (connection && role === "Teacher") {
            await connection.invoke("SendAnnouncement", chatRoom, message);
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
                            <div className="flex flex-col gap-4">

                                {/*Announcements*/}
                                <div className="bg-yellow-100 p-3 rounded">
                                    <h3 className="font-bold"> Announcements</h3>

                                    {announcements.map((a, i) => (
                                        <div key={i}>
                                            <strong>{a.user}:</strong> {a.message}
                                        </div>
                                    ))}

                                    {/*Only teachers can send announcement*/}
                                    {role === "Teacher" && (
                                        <div className="mt-2">
                                            <ChatBox sendMessage={sendAnnouncement} />
                                        </div>
                                    )}
                                </div>

                                {/*Chat*/}
                                <div className="bg-white p-3 rounded">
                                    <h3 className="font-bold"> Chat</h3>
                                    <ChatRoom usermessages={usermessages} />
                                    <ChatBox sendMessage={sendMessage} />
                                </div>

                            </div>
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

                                <select value={role} onChange={(e) => setRole(e.target.value)}>
                                    <option value="">Select role</option>
                                    <option value="Student">Student</option>
                                    <option value="Teacher">Teacher</option>
                                </select>

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