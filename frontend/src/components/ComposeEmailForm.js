import React, { useRef, useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Box,
    IconButton,
    Collapse,
    Typography,
    Divider,
    LinearProgress,
    Snackbar
} from '@mui/material';
import {
    Close as CloseIcon,
    ExpandMore as ExpandMoreIcon,
    ExpandLess as ExpandLessIcon,
    Send as SendIcon,
    AttachFile as AttachFileIcon,
    FormatBold as FormatBoldIcon,
    FormatItalic as FormatItalicIcon,
    FormatUnderlined as FormatUnderlinedIcon,
    AutoAwesome as AutoAwesomeIcon
} from '@mui/icons-material';
import AIPromptForm from '@/components/AIPromptForm';

const ComposeEmailForm = ({ open, onClose, fetchEmails }) => {
    // Email Form
    const [formData, setFormData] = useState({
        to: '',
        cc: '',
        bcc: '',
        subject: '',
        body: '',
    });
    const [showCcBcc, setShowCcBcc] = useState(false);
    const [errors, setErrors] = useState({});
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    // AI Form
    const [aiModalOpen, setAiModalOpen] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);

    const handleInputChange = (field) => (event) => {
        const value = event.target.value;
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!formData.to.trim()) {
            newErrors.to = 'Recipient is required';
        } else if (!emailRegex.test(formData.to.trim())) {
            newErrors.to = 'Please enter a valid email address';
        }

        if (!formData.subject.trim()) {
            newErrors.subject = 'Subject is required';
        }

        if (!formData.body.trim()) {
            newErrors.body = 'Message body is required';
        }

        // Validate CC if provided
        if (formData.cc.trim() && !emailRegex.test(formData.cc.trim())) {
            newErrors.cc = 'Please enter a valid CC email address';
        }

        // Validate BCC if provided
        if (formData.bcc.trim() && !emailRegex.test(formData.bcc.trim())) {
            newErrors.bcc = 'Please enter a valid BCC email address';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSend = async () => {
        if (validateForm()) {
            try {
                const response = await fetch('http://localhost:3001/api/email/send', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        to: formData.to,
                        subject: formData.subject,
                        body: formData.body,
                        cc: formData.cc,
                        bcc: formData.bcc
                    }),
                });
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const data = await response.json();
                console.log('Email sent successfully:', data);
                fetchEmails();
                setSnackbar({
                    open: true,
                    message: 'Email sent successfully',
                    severity: 'success'
                });
            } catch (error) {
                console.error('Error sending email:', error);
                setSnackbar({
                    open: true,
                    message: 'Error sending email',
                    severity: 'error'
                });
            }
            finally {
                handleClose();
            }
        }
    };

    const handleClose = () => {
        // Reset form when closing
        setFormData({
            to: '',
            cc: '',
            bcc: '',
            subject: '',
            body: ''
        });
        setErrors({});
        setShowCcBcc(false);
        onClose();
    };

    const toggleCcBcc = () => {
        setShowCcBcc(!showCcBcc);
    };

    return (
        <>
            <Dialog
                open={open}
                onClose={handleClose}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        minHeight: '500px',
                        maxHeight: '80vh',
                        position: 'fixed',
                        bottom: 16,
                        right: 16,
                        margin: 0,
                        width: '500px',
                        maxWidth: 'calc(100vw - 32px)',
                    }
                }}
                sx={{
                    '& .MuiDialog-paper': {
                        margin: 0
                    }
                }}
            >
                <DialogTitle
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        pb: 1
                    }}
                >
                    <Typography variant="h6" component="div">
                        Compose Email
                    </Typography>
                    <IconButton
                        edge="end"
                        color="inherit"
                        onClick={handleClose}
                        aria-label="close"
                    >
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>

                <Divider />

                <DialogContent sx={{ p: 0 }}>
                    <Box sx={{ p: 2 }}>
                        {/* To Field */}
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Typography
                                variant="body2"
                                sx={{ width: 60, color: 'text.secondary', mr: 2 }}
                            >
                                To:
                            </Typography>
                            <TextField
                                fullWidth
                                variant="standard"
                                value={formData.to}
                                onChange={handleInputChange('to')}
                                error={!!errors.to}
                                helperText={errors.to}
                                placeholder="recipient@example.com"
                                InputProps={{
                                    disableUnderline: true,
                                    sx: { fontSize: '0.95rem' }
                                }}
                            />
                            <Button
                                size="small"
                                onClick={toggleCcBcc}
                                sx={{ ml: 1, minWidth: 'auto' }}
                            >
                                {showCcBcc ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                                {showCcBcc ? 'Less' : 'Cc/Bcc'}
                            </Button>
                        </Box>

                        {/* CC and BCC Fields */}
                        <Collapse in={showCcBcc}>
                            <Box sx={{ mb: 2 }}>
                                {/* CC Field */}
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <Typography
                                        variant="body2"
                                        sx={{ width: 60, color: 'text.secondary', mr: 2 }}
                                    >
                                        Cc:
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        variant="standard"
                                        value={formData.cc}
                                        onChange={handleInputChange('cc')}
                                        error={!!errors.cc}
                                        helperText={errors.cc}
                                        placeholder="cc@example.com"
                                        InputProps={{
                                            disableUnderline: true,
                                            sx: { fontSize: '0.95rem' }
                                        }}
                                    />
                                </Box>

                                {/* BCC Field */}
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                    <Typography
                                        variant="body2"
                                        sx={{ width: 60, color: 'text.secondary', mr: 2 }}
                                    >
                                        Bcc:
                                    </Typography>
                                    <TextField
                                        fullWidth
                                        variant="standard"
                                        value={formData.bcc}
                                        onChange={handleInputChange('bcc')}
                                        error={!!errors.bcc}
                                        helperText={errors.bcc}
                                        placeholder="bcc@example.com"
                                        InputProps={{
                                            disableUnderline: true,
                                            sx: { fontSize: '0.95rem' }
                                        }}
                                    />
                                </Box>
                            </Box>
                        </Collapse>

                        {/* Subject Field */}
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <Typography
                                variant="body2"
                                sx={{ width: 60, color: 'text.secondary', mr: 2 }}
                            >
                                Subject:
                            </Typography>
                            <TextField
                                fullWidth
                                variant="standard"
                                value={formData.subject}
                                onChange={handleInputChange('subject')}
                                error={!!errors.subject}
                                helperText={errors.subject}
                                placeholder="Enter subject"
                                InputProps={{
                                    disableUnderline: true,
                                    sx: { fontSize: '0.95rem' }
                                }}
                            />
                        </Box>

                        <Divider sx={{ mb: 2 }} />

                        {/* Formatting Toolbar */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Box sx={{ display: 'flex', gap: 1, opacity: 0.7 }}>
                                <IconButton size="small" disabled>
                                    <FormatBoldIcon fontSize="small" />
                                </IconButton>
                                <IconButton size="small" disabled>
                                    <FormatItalicIcon fontSize="small" />
                                </IconButton>
                                <IconButton size="small" disabled>
                                    <FormatUnderlinedIcon fontSize="small" />
                                </IconButton>
                                <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
                                <IconButton size="small" disabled>
                                    <AttachFileIcon fontSize="small" />
                                </IconButton>
                                <Typography variant="caption" sx={{ alignSelf: 'center', ml: 1, color: 'text.secondary' }}>
                                    Formatting tools (coming soon)
                                </Typography>
                            </Box>
                            <Button disabled={isStreaming} sx={{ backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }} endIcon={<AutoAwesomeIcon />} variant='contained' onClick={() => setAiModalOpen(true)}>
                               {isStreaming ? 'Generating...' : 'AI'}
                            </Button>
                        </Box>

                        {/* Message Body */}
                        <TextField
                            fullWidth
                            multiline
                            rows={12}
                            variant="outlined"
                            value={formData.body}
                            onChange={handleInputChange('body')}
                            error={!!errors.body}
                            helperText={errors.body}
                            placeholder={isStreaming ? 'Generating email body...' : 'Compose your message...'}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    fontSize: '0.95rem',
                                    lineHeight: 1.6
                                }
                            }}
                        />
                    </Box>
                </DialogContent>

                <DialogActions
                    sx={{
                        px: 2,
                        py: 1.5,
                        justifyContent: 'space-between',
                        borderTop: 1,
                        borderColor: 'divider'
                    }}
                >
                    <Typography variant="caption" color="text.secondary">
                        Press Ctrl+Enter to send
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button onClick={handleClose} color="inherit">
                            Cancel
                        </Button>
                        <Button
                            disabled={isStreaming}
                            onClick={handleSend}
                            variant="contained"
                            startIcon={<SendIcon />}
                            sx={{ minWidth: 120 }}
                        >
                            Send
                        </Button>
                    </Box>
                </DialogActions>
            </Dialog>
            <AIPromptForm
                open={aiModalOpen}
                setOpen={setAiModalOpen}
                onClose={() => setAiModalOpen(false)}
                isStreaming={isStreaming}
                setIsStreaming={setIsStreaming}
                formData={formData}
                setFormData={setFormData}
            />
            <Snackbar
                open={snackbar.open}
                autoHideDuration={3000}
                onClose={() => setSnackbar({ open: false, message: '', severity: 'success' })}
                message={snackbar.message}
                severity={snackbar.severity}
            />
        </>
    );
};

export default ComposeEmailForm;