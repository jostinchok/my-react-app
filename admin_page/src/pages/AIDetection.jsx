
import React, {useState} from "react";
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Snackbar, Dialog, DialogTitle, DialogContent, Button} from "@mui/material";
import WarningIcon from "@mui/icons-material/Warning";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

const AIDetection = () => {
    const [events, setEvents] = useState([
        { id: 1, time: "2026-04-03 14:20", location: "Bako Park", type: "Plant", severity: "Medium", status: "New" },
        { id: 2, time: "2026-04-03 15:10", location: "Semenggoh", type: "Wildlife", severity: "High", status: "New" },
        { id: 3, time: "2026-04-03 16:00", location: "Gunung Gading", type: "Trail", severity: "Low", status: "Resolved" },

    ])

    const [snackbar, setSnackbar] = useState({ open: false, message:""});
    const [selectedEvent, setSelectedEvent] = useState(null);

    const markResolved = (id) => {
        setEvents(prev => prev.map(e => e.id === id ? {...e, status: "Resolved"} :e ));
        setSnackbar({ open: true, message: "Event marked as resolved" });
    };

    return (
        <Box sx={{ p:3 }}>
            <Typography variant="h4" sx={{ mb:2, fontWeight: "bold" }}>
                AI Abnormal Detection
            </Typography>

            <Paper sx={{ p:2, mb:2, backgroundColor:"#fce4ec"}}>
                <Typography variant="body2" color="text.secondary">
                    Monitoring abnormal activities in protected areas: Plant, Wildlife, Trail, Object.
                </Typography>
            </Paper>
            
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Time</TableCell>
                            <TableCell>Location</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Severity</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {events.map(event => (
                            <TableRow key={event.id}>
                                <TableCell>{event.time}</TableCell>
                                <TableCell>{event.location}</TableCell>
                                <TableCell>{event.type}</TableCell>
                                <TableCell>{event.severity}</TableCell>
                                <TableCell>{event.status}</TableCell>
                                <TableCell>
                                    <IconButton color="primary" onClick={() => setSelectedEvent(event)}>
                                        <WarningIcon />
                                    </IconButton>
                                    <IconButton>
                                        <IconButton color="success" onClick={() => markResolved(event.id)}>
                                            <CheckCircleIcon />
                                        </IconButton>
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <Dialog open={Boolean(selectedEvent)} onClose={() => setSelectedEvent(null)}>
                <DialogTitle>Event Details - {selectedEvent?.type}</DialogTitle>
                <DialogContent>
                    <Typography>Time: {selectedEvent?.time}</Typography>
                    <Typography>Location: {selectedEvent?.location}</Typography>
                    <Typography>Severity: {selectedEvent?.severity}</Typography>
                    <Typography>Status: {selectedEvent?.status}</Typography>

                    <Typography sx={{ mt:2, fontWeight:"bold"}}>AI Analysis</Typography>
                    <Typography>Confidence Level: 85%</Typography>
                    <Typography>Model: </Typography>
                </DialogContent>
            </Dialog>
        </Box>
    )
}
export default AIDetection;
