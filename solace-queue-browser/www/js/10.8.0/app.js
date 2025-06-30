// Initialize Solace Systems Web Messaging API for JavaScript
var factoryProps = new solace.SolclientFactoryProperties();
factoryProps.profile = solace.SolclientFactoryProfiles.version10;
solace.SolclientFactory.init(factoryProps);

// Vue.js application
const app = Vue.createApp({
    data() {
        return {
            loading: false,
            connecting: false,
            isConnected: false,
            connectionStatus: 'Disconnected',
            config: {
                url: '',
                vpn: '',
                username: '',
                password: ''
            },
            session: null,
            queues: [],
            queueFilter: '',
            selectedQueue: '',
            messages: [],
            flowMap: new Map(),
            error: null
        }
    },
    computed: {
        connectionStatusClass() {
            switch (this.connectionStatus) {
                case 'Connected': return 'status-connected';
                case 'Connecting': return 'status-connecting';
                default: return 'status-disconnected';
            }
        },
        filteredQueues() {
            if (!this.queueFilter) return this.queues;
            const filter = this.queueFilter.toLowerCase();
            return this.queues.filter(q => q.name.toLowerCase().includes(filter));
        }
    },
    methods: {
        // Connection Management
        async connect() {
            try {
                this.connecting = true;
                this.connectionStatus = 'Connecting';
                
                // Create session
                const properties = new solace.SessionProperties();
                properties.url = this.config.url;
                properties.vpnName = this.config.vpn;
                properties.userName = this.config.username;
                properties.password = this.config.password;
                properties.reconnectRetries = 3;

                this.session = solace.SolclientFactory.createSession(properties);

                // Define session event listeners
                this.session.on(solace.SessionEventCode.UP_NOTICE, () => {
                    this.isConnected = true;
                    this.connectionStatus = 'Connected';
                    this.refreshQueues();
                });

                this.session.on(solace.SessionEventCode.DISCONNECTED, () => {
                    this.handleDisconnect();
                });

                this.session.on(solace.SessionEventCode.DOWN_ERROR, () => {
                    this.handleDisconnect();
                });

                // Connect to Solace message broker
                await this.session.connect();
            } catch (error) {
                console.error('Connection failed:', error);
                this.error = `Connection failed: ${error.message || error}`;
                this.handleDisconnect();
            } finally {
                this.connecting = false;
            }
        },

        handleDisconnect() {
            this.isConnected = false;
            this.connectionStatus = 'Disconnected';
            this.queues = [];
            this.selectedQueue = '';
            this.messages = [];
            this.flowMap.clear();
        },

        disconnect() {
            if (this.session) {
                this.session.disconnect();
            }
        },

        // Queue Management
        async refreshQueues() {
            try {
                this.loading = true;
                this.queues = [];

                // Request queue information using SEMP over Message Bus
                const sempTopic = '#P2P/REST/GET/SEMP/v2/monitor/queues';
                const sempRequest = {
                    method: 'GET',
                    path: '/SEMP/v2/monitor/queues'
                };

                return new Promise((resolve, reject) => {
                    const requestTimeout = setTimeout(() => {
                        reject(new Error('Queue list request timed out'));
                    }, 10000);

                    const messageHandler = (message) => {
                        try {
                            const payload = JSON.parse(message.getBinaryAttachment());
                            if (payload.data) {
                                this.queues = payload.data.map(q => ({
                                    name: q.queueName,
                                    messages: q.msgSpoolUsage
                                }));
                            }
                            clearTimeout(requestTimeout);
                            resolve();
                        } catch (error) {
                            reject(error);
                        }
                    };

                    try {
                        // Subscribe to response topic
                        const responseTopicSub = `#P2P/REST/GET/SEMP/v2/monitor/queues/>`;
                        this.session.subscribe(
                            solace.SolclientFactory.createTopicDestination(responseTopicSub),
                            true,
                            responseTopicSub,
                            10000
                        );

                        // Send request
                        const request = solace.SolclientFactory.createMessage();
                        request.setDestination(solace.SolclientFactory.createTopicDestination(sempTopic));
                        request.setBinaryAttachment(JSON.stringify(sempRequest));
                        request.setDeliveryMode(solace.MessageDeliveryModeType.DIRECT);
                        
                        this.session.on(solace.SessionEventCode.MESSAGE, messageHandler);
                        this.session.send(request);
                    } catch (error) {
                        clearTimeout(requestTimeout);
                        reject(error);
                    }
                });
            } catch (error) {
                console.error('Failed to refresh queues:', error);
                this.error = `Failed to refresh queues: ${error.message || error}`;
            } finally {
                this.loading = false;
            }
        },

        // Message Management
        async selectQueue(queueName) {
            this.selectedQueue = queueName;
            await this.refreshMessages();
        },

        async refreshMessages() {
            if (!this.selectedQueue) return;

            try {
                this.loading = true;
                this.messages = [];

                // Clean up existing flow if any
                if (this.flowMap.has(this.selectedQueue)) {
                    const flow = this.flowMap.get(this.selectedQueue);
                    flow.stop();
                    this.flowMap.delete(this.selectedQueue);
                }

                // Create queue browser
                const flowProperties = new solace.QueueBrowserProperties();
                flowProperties.startLocation = 0;
                flowProperties.waitTimeout = 1000;
                flowProperties.requestTimeout = 10000;

                const messageConsumer = this.session.createQueueBrowser(
                    solace.SolclientFactory.createDurableQueueDestination(this.selectedQueue),
                    flowProperties,
                    (message) => {
                        try {
                            const msg = {
                                id: message.getCorrelationId() || message.getMessageId(),
                                timeStamp: message.getSenderTimestamp(),
                                headers: {
                                    'Message ID': message.getMessageId(),
                                    'Correlation ID': message.getCorrelationId(),
                                    'Destination': message.getDestination()?.getName(),
                                    'Reply To': message.getReplyTo()?.getName(),
                                    'Content Type': message.getHTTPContentType(),
                                    'Delivery Mode': message.getDeliveryMode(),
                                    'Priority': message.getPriority()
                                },
                                payload: this.parseMessagePayload(message)
                            };
                            this.messages.push(msg);
                        } catch (error) {
                            console.error('Error processing message:', error);
                        }
                    },
                    (error) => {
                        if (error) {
                            console.error('Queue Browser error:', error);
                            this.error = `Queue Browser error: ${error.message || error}`;
                        }
                    }
                );

                this.flowMap.set(this.selectedQueue, messageConsumer);
                messageConsumer.start();
            } catch (error) {
                console.error('Failed to refresh messages:', error);
                this.error = `Failed to refresh messages: ${error.message || error}`;
            } finally {
                this.loading = false;
            }
        },

        parseMessagePayload(message) {
            try {
                const attachment = message.getBinaryAttachment();
                if (!attachment) return null;

                // Try to parse as JSON first
                try {
                    return JSON.parse(attachment);
                } catch {
                    // If not JSON, return as string
                    return attachment;
                }
            } catch (error) {
                console.error('Error parsing message payload:', error);
                return null;
            }
        },

        formatPayload(payload) {
            if (!payload) return 'No payload';
            if (typeof payload === 'object') {
                return JSON.stringify(payload, null, 2);
            }
            return payload;
        },

        formatDate(timestamp) {
            if (!timestamp) return 'N/A';
            return new Date(timestamp).toLocaleString();
        },

        exportMessages() {
            try {
                const data = JSON.stringify(this.messages, null, 2);
                const blob = new Blob([data], { type: 'application/json' });
                const filename = `${this.selectedQueue}-messages-${new Date().toISOString()}.json`;
                saveAs(blob, filename);
            } catch (error) {
                console.error('Failed to export messages:', error);
                this.error = `Failed to export messages: ${error.message || error}`;
            }
        }
    },
    
    // Lifecycle hooks
    beforeUnmount() {
        this.disconnect();
    }
});

// Mount Vue application
app.mount('#app'); 