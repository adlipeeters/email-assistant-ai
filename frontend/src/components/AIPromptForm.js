import React, { useRef, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Box,
    Typography,
    IconButton,
    Fade,
    Chip,
} from '@mui/material';
import {
    Close as CloseIcon,
    AutoAwesome as AutoAwesomeIcon,
    Psychology as PsychologyIcon
} from '@mui/icons-material';

const AIPromptForm = ({ open, setOpen, onClose, isStreaming, setIsStreaming, formData, setFormData }) => {
    const [prompt, setPrompt] = useState('');
    const [error, setError] = useState('');
    const abortControllerRef = useRef(null);

    const handleOnGenerate = async () => {
        if (!prompt.trim()) {
            setError('Please enter a prompt');
            return;
        }

        setIsStreaming(true);
        setError('');
        setFormData(prev => ({
            ...prev,
            subject: '',
            body: '',
        }));
        setOpen(false);

        abortControllerRef.current = new AbortController();

        try {
            const response = await fetch('http://localhost:3001/api/ai/generate/stream', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',

                },
                credentials: 'include',
                body: JSON.stringify({
                    prompt: prompt,
                    to: formData.to,
                }),
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
                                setFormData(prev => ({
                                    ...prev,
                                    assistantType: data.data.assistantType
                                }));
                                setFormData(prev => ({
                                    ...prev,
                                    subject: data.data.subject,
                                    body: data.data.body,
                                }));
                            } else if (data.type === 'content') {
                                setFormData(prev => ({
                                    ...prev,
                                    subject: data.data.subject || prev.subject,
                                    body: data.data.body || prev.body,
                                }));
                            } else if (data.type === 'complete') {
                                setFormData(prev => ({
                                    ...prev,
                                    subject: data.data.subject,
                                    body: data.data.body,
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
            setPrompt('');
        }
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            TransitionComponent={Fade}
        >
            <DialogTitle
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    pb: 1,
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AutoAwesomeIcon />
                    <Typography variant="h6" component="div">
                        AI Email Generator
                    </Typography>
                </Box>
                <IconButton
                    edge="end"
                    color="inherit"
                    onClick={onClose}
                    aria-label="close"
                    size="small"
                    sx={{ color: 'white' }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ pt: 3, pb: 2 }}>
                <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <PsychologyIcon color="primary" fontSize="small" />
                        <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                            What should this email be about?
                        </Typography>
                    </Box>
                </Box>

                <TextField
                    fullWidth
                    multiline
                    rows={4}
                    variant="outlined"
                    placeholder="e.g., Write a professional follow-up email about the project deadline, asking for status update with a polite tone"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    autoFocus
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                            fontSize: '0.95rem',
                            lineHeight: 1.5,
                            '&:hover': {
                                '& > fieldset': {
                                    borderColor: 'primary.main'
                                }
                            },
                            '&.Mui-focused': {
                                '& > fieldset': {
                                    borderWidth: '2px'
                                }
                            }
                        }
                    }}
                />

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
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
                <Button
                    onClick={onClose}
                    color="inherit"
                    sx={{ minWidth: 80 }}
                >
                    Cancel
                </Button>
                <Button
                    onClick={handleOnGenerate}
                    variant="contained"
                    startIcon={<AutoAwesomeIcon />}
                    disabled={!prompt.trim()}
                >
                    Generate
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AIPromptForm;