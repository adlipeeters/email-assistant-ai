import React, { useEffect, useState } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Paper,
  Divider,
  Chip,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Email as EmailIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Reply as ReplyIcon,
  Forward as ForwardIcon,
  Delete as DeleteIcon,
  Mail as MailIcon
} from '@mui/icons-material';
import { Button } from '@mui/material';
import ComposeEmailForm from '@/components/ComposeEmailForm';
// import { emails } from '@/mock/emails';

const EmailList = () => {
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [emailList, setEmailList] = useState([]);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleEmailClick = (email) => {
    setSelectedEmail(email);
  };

  const toggleStar = (emailId, event) => {
    event.stopPropagation();
    setEmailList(prev =>
      prev.map(email =>
        email.id === emailId
          ? { ...email, isStarred: !email.isStarred }
          : email
      )
    );
  };

  const formatContent = (content) => {
    const lines = content.split('\n');

    return (
      <Box component="div">
        {lines.map((line, index) => (
          <Box
            key={index}
            component="div"
            sx={{
              mb: line.trim() === '' ? 2 : 1,
              lineHeight: 1.6,
              fontSize: '1rem',
              color: 'text.primary'
            }}
          >
            {line || '\u00A0'}
          </Box>
        ))}
      </Box>
    );
  };

  const fetchEmails = async () => {
    const response = await fetch('http://localhost:3001/api/email/get-all');
    const data = await response.json();
    setEmailList(data);
    setSelectedEmail(data[0]);
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'background.default', position: 'relative' }}>
      {/* Email List Sidebar */}
      <Paper
        elevation={0}
        sx={{
          width: isMobile ? '100%' : 380,
          borderRight: 1,
          borderColor: 'divider',
          display: isMobile && selectedEmail ? 'none' : 'block'
        }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EmailIcon color="primary" />
            Inbox
          </Typography>
        </Box>

        <List sx={{ p: 0, overflow: 'auto', height: 'calc(100vh - 80px)' }}>
          {emailList.map((email, index) => (
            <React.Fragment key={email.id}>
              <ListItem
                button
                selected={selectedEmail?.id === email.id}
                onClick={() => handleEmailClick(email)}
                sx={{
                  py: 1.5,
                  px: 2,
                  position: 'relative',
                  '&.Mui-selected': {
                    bgcolor: 'primary.light',
                    color: 'primary.contrastText',
                    '&:hover': {
                      bgcolor: 'primary.main',
                    }
                  }
                }}
              >
                <ListItemAvatar>
                  <Avatar
                    sx={{
                      bgcolor: email.avatarColor,
                      width: 40,
                      height: 40,
                      fontSize: '1rem',
                      fontWeight: 'bold'
                    }}
                  >
                    {email.avatar}
                  </Avatar>
                </ListItemAvatar>

                <ListItemText
                  primary={email.sender}
                  secondary={`${email.subject} - ${email.body.slice(0, 12)}...`}
                  primaryTypographyProps={{
                    variant: "subtitle2",
                    sx: {
                      color: selectedEmail?.id === email.id ? 'inherit' : 'text.primary',
                      mb: 0.5
                    },
                    noWrap: true
                  }}
                  secondaryTypographyProps={{
                    variant: "body2",
                    sx: {
                      color: selectedEmail?.id === email.id ? 'inherit' : 'text.secondary',
                      opacity: 0.8
                    },
                    noWrap: true
                  }}
                />

                {/* Timestamp and Star - positioned absolutely */}
                <Box sx={{
                  position: 'absolute',
                  top: 8,
                  right: 16,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5
                }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    {new Date(email.created_at).toLocaleString()}
                  </Typography>
                </Box>
              </ListItem>
              {index < emailList.length - 1 && <Divider />}
            </React.Fragment>
          ))}
        </List>
      </Paper>

      {/* Email Content */}
      {selectedEmail && (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Email Header */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderBottom: 1,
              borderColor: 'divider',
              bgcolor: 'background.paper'
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h5" sx={{ mb: 1, fontWeight: 'bold' }}>
                  {selectedEmail.subject}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Avatar
                    sx={{
                      bgcolor: selectedEmail.avatarColor,
                      width: 32,
                      height: 32
                    }}
                  >
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                      {selectedEmail.sender}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedEmail.senderEmail}
                    </Typography>
                    {/* to */}
                    <Typography variant="body2" color="text.secondary">
                      To: {selectedEmail.to}
                    </Typography>
                    {/* cc */}
                    <Typography variant="body2" color="text.secondary">
                      CC: {selectedEmail.cc || 'N/A'}
                    </Typography>
                    {/* bcc */}
                    <Typography variant="body2" color="text.secondary">
                      BCC: {selectedEmail.bcc || 'N/A'}
                    </Typography>
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {new Date(selectedEmail.created_at).toLocaleString()}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton size="small" color="primary">
                  <ReplyIcon />
                </IconButton>
                <IconButton size="small" color="primary">
                  <ForwardIcon />
                </IconButton>
                <IconButton size="small" color="error">
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Box>
          </Paper>

          {/* Email Content */}
          <Box
            sx={{
              flex: 1,
              p: 3,
              overflow: 'auto',
              bgcolor: 'background.paper'
            }}
          >
            <Box sx={{ maxWidth: '100%' }}>
              {formatContent(selectedEmail.body)}
            </Box>
          </Box>
        </Box>
      )}

      {/* Compose Email Modal */}
      <ComposeEmailForm
        open={isComposeOpen}
        onClose={() => setIsComposeOpen(false)}
        fetchEmails={fetchEmails}
      />
      <Button startIcon={<MailIcon />} sx={{ position: 'absolute', bottom: 16, right: 16 }} variant="contained" color="primary" onClick={() => setIsComposeOpen(true)}>
        Compose
      </Button>
    </Box>
  );
};

export default EmailList;