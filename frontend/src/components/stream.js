import React, { useState, useRef } from 'react';
import {
    Box,
    Card,
    CardContent,
    TextField,
    Button,
    Typography,
    LinearProgress,
    Chip,
    Alert,
    Paper,
    Divider
} from '@mui/material';
import { Send as SendIcon, AutoAwesome as AIIcon } from '@mui/icons-material';

const AIEmailStream = () => {
    const [prompt, setPrompt] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamData, setStreamData] = useState({
        assistantType: '',
        subject: '',
        body: '',
        isComplete: false
    });
    const [error, setError] = useState('');
    const abortControllerRef = useRef(null);

    const handleStreamGeneration = async () => {
        if (!prompt.trim()) {
            setError('Please enter a prompt');
            return;
        }

        setIsStreaming(true);
        setError('');
        setStreamData({
            assistantType: '',
            subject: '',
            body: '',
            isComplete: false
        });

        // Create abort controller for cancellation
        abortControllerRef.current = new AbortController();

        try {
            const response = await fetch('http://localhost:3001/api/ai/generate/stream', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',

                },
                credentials: 'include',
                body: JSON.stringify({ prompt }),
                signal: abortControllerRef.current.signal
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const reader = response.body?.getReader();
            if (!reader) {
                throw new Error('No reader available');
            }

            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();

                if (done) break;

                buffer += decoder.decode(value, { stream: true });

                // Process complete lines
                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // Keep incomplete line in buffer

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        try {
                            const data = JSON.parse(line.substring(6));

                            if (data.type === 'classification') {
                                setStreamData(prev => ({
                                    ...prev,
                                    assistantType: data.data.assistantType
                                }));
                            } else if (data.type === 'content') {
                                setStreamData(prev => ({
                                    ...prev,
                                    subject: data.data.subject || prev.subject,
                                    body: data.data.body || prev.body,
                                    isComplete: false
                                }));
                            } else if (data.type === 'complete') {
                                setStreamData(prev => ({
                                    ...prev,
                                    subject: data.data.subject,
                                    body: data.data.body,
                                    isComplete: true
                                }));
                            } else if (data.type === 'error') {
                                setError(data.data.error);
                            }
                        } catch (parseError) {
                            console.error('Parse error:', parseError);
                        }
                    }
                }
            }
        } catch (err) {
            if (err.name === 'AbortError') {
                console.log('Stream aborted');
            } else {
                setError(err.message || 'Failed to generate email');
            }
        } finally {
            setIsStreaming(false);
            abortControllerRef.current = null;
        }
    };

    const handleCancel = () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
    };

    const getAssistantColor = (type) => {
        switch (type) {
            case 'sales': return 'success';
            case 'followup': return 'info';
            default: return 'default';
        }
    };

    return (
        <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
            <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AIIcon color="primary" />
                AI Email Generator - Live Stream
            </Typography>

            {/* Input Section */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        variant="outlined"
                        label="Describe your email request"
                        placeholder="e.g., Follow up on our meeting last Tuesday about the new project timeline"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        disabled={isStreaming}
                        sx={{ mb: 2 }}
                    />

                    <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <Button
                            variant="contained"
                            startIcon={<SendIcon />}
                            onClick={handleStreamGeneration}
                            disabled={isStreaming || !prompt.trim()}
                            sx={{ minWidth: 140 }}
                        >
                            {isStreaming ? 'Generating...' : 'Generate Email'}
                        </Button>

                        {isStreaming && (
                            <Button
                                variant="outlined"
                                color="error"
                                onClick={handleCancel}
                            >
                                Cancel
                            </Button>
                        )}
                    </Box>

                    {/* Progress Indicator */}
                    {isStreaming && (
                        <Box sx={{ mt: 2 }}>
                            <LinearProgress />
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                                AI is generating your email...
                            </Typography>
                        </Box>
                    )}
                </CardContent>
            </Card>

            {/* Error Display */}
            {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                </Alert>
            )}

            {/* Results Section */}
            {(streamData.assistantType || streamData.subject || streamData.body) && (
                <Card>
                    <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Typography variant="h6">
                                Generated Email
                            </Typography>

                            {streamData.assistantType && (
                                <Chip
                                    label={`${streamData.assistantType.toUpperCase()} Assistant`}
                                    color={getAssistantColor(streamData.assistantType)}
                                    size="small"
                                />
                            )}

                            {streamData.isComplete && (
                                <Chip
                                    label="Complete"
                                    color="success"
                                    size="small"
                                    variant="outlined"
                                />
                            )}
                        </Box>

                        {/* Subject Field */}
                        <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Subject Line:
                            </Typography>
                            <Typography
                                variant="body1"
                                sx={{
                                    minHeight: 24,
                                    fontWeight: 500,
                                    color: streamData.subject ? 'text.primary' : 'text.disabled'
                                }}
                            >
                                {streamData.subject || (isStreaming ? 'Generating subject...' : 'No subject yet')}
                            </Typography>
                        </Paper>

                        <Divider sx={{ my: 2 }} />

                        {/* Body Field */}
                        <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                Email Body:
                            </Typography>
                            <Typography
                                variant="body1"
                                sx={{
                                    minHeight: 60,
                                    whiteSpace: 'pre-wrap',
                                    lineHeight: 1.6,
                                    color: streamData.body ? 'text.primary' : 'text.disabled'
                                }}
                            >
                                {streamData.body || (isStreaming ? 'Generating email body...' : 'No content yet')}
                            </Typography>
                        </Paper>

                        {/* Metadata */}
                        {streamData.isComplete && (
                            <Box sx={{ mt: 2, p: 2, bgcolor: 'success.50', borderRadius: 1 }}>
                                <Typography variant="caption" color="success.dark">
                                    ✅ Email generation completed successfully!
                                    {streamData.assistantType === 'sales' && ' (Optimized for sales with 40 words max)'}
                                    {streamData.assistantType === 'followup' && ' (Professional follow-up tone)'}
                                </Typography>
                            </Box>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Example Prompts */}
            <Box sx={{ mt: 4 }}>
                <Typography variant="h6" gutterBottom>
                    Try these example prompts:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {[
                        "Follow up on our demo meeting from last week",
                        "Pitch our new analytics platform to TechCorp",
                        "Check status of the proposal we sent two weeks ago",
                        "Introduce our cloud security solution to a startup CEO"
                    ].map((example, index) => (
                        <Chip
                            key={index}
                            label={example}
                            variant="outlined"
                            onClick={() => setPrompt(example)}
                            disabled={isStreaming}
                            sx={{ cursor: 'pointer' }}
                        />
                    ))}
                </Box>
            </Box>
        </Box>
    );
};

export default AIEmailStream;