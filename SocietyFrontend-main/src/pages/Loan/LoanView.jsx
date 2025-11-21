import React, { useEffect, useState } from "react";
import {
    Paper,
    Typography,
    Divider,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    Box,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Card,
    CardContent,
    Chip,
    Tooltip,
    Tabs,
    Tab
} from "@mui/material";
import { useNavigate, useLocation } from "react-router-dom";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Download, ArrowBack, Add } from "@mui/icons-material";

const STORAGE_KEY = "loan_pdc_app_all";

// Tab Panel Component
function TabPanel({ children, value, index, ...other }) {
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`tabpanel-${index}`}
            aria-labelledby={`tab-${index}`}
            {...other}
        >
            {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
        </div>
    );
}

const LoanView = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [data, setData] = useState(null);
    const [allMembers, setAllMembers] = useState([]);
    const [selectedMember, setSelectedMember] = useState("");
    const [activeTab, setActiveTab] = useState(0); // 0 for Loan, 1 for PDC

    useEffect(() => {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};

        // Get all members for dropdown
        const members = Object.keys(saved).map(membershipNumber => ({
            membershipNumber,
            name: saved[membershipNumber]?.loan?.memberName || "N/A"
        }));
        setAllMembers(members);

        // Set initial selected member
        let membership = location.state?.membershipNumber;
        if (!membership && members.length > 0) {
            membership = members[0].membershipNumber;
        }

        if (membership) {
            setSelectedMember(membership);
            if (saved[membership]) {
                setData(saved[membership]);
            }
        }
    }, [location.state]);

    const handleMemberChange = (event) => {
        const membershipNumber = event.target.value;
        setSelectedMember(membershipNumber);

        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
        if (saved[membershipNumber]) {
            setData(saved[membershipNumber]);
        } else {
            setData(null);
        }
    };

    const handleAddNewLoan = () => {
        navigate("/loan", {
            state: {
                prefillMembership: selectedMember || undefined
            }
        });
    };

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    // Function to format field values
    const formatFieldValue = (key, value) => {
        if (typeof value === 'string' && value.includes('T')) {
            // Format date
            return new Date(value).toLocaleDateString('en-IN');
        }
        if (key.toLowerCase().includes('amount')) {
            // Format currency
            return `₹${Number(value).toLocaleString('en-IN')}`;
        }
        return value;
    };

    // Get loan details for table in structured format
    const getLoanTableData = () => {
        if (!data || !data.loan) return [];

        const loan = data.loan;
        const tableData = [];

        // Add main loan details
        if (loan.loanType) {
            tableData.push({
                sno: 1,
                loanType: loan.loanType,
                membershipNumber: loan.membershipNumber || loan.lafMembershipNumber,
                amount: loan.loanAmount || loan.lafAmount,
                date: loan.loanDate || loan.lafDate,
                purpose: loan.purpose,
                fdrAmount: loan.fdrAmount,
                fdrScheme: loan.fdrScheme
            });
        }

        return tableData;
    };

    // Function to download Loan PDF only
    const handleDownloadLoanPDF = () => {
        if (!data) return;

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // Header
        doc.setFillColor(63, 81, 181);
        doc.rect(0, 0, pageWidth, 30, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont("helvetica", "bold");
        doc.text("LOAN DETAILS", pageWidth / 2, 18, { align: "center" });

        // Member Information
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(`Member: ${data.loan.membershipNumber || data.loan.lafMembershipNumber || 'N/A'}`, 14, 40);
        doc.text(`Loan Type: ${data.loan.loanType || 'N/A'}`, 14, 47);

        // Create loan details table for PDF
        const loanTableData = getLoanTableData();
        const loanData = loanTableData.map((row, index) => [
            index + 1,
            row.loanType || 'N/A',
            row.membershipNumber || 'N/A',
            row.amount ? `${Number(row.amount).toLocaleString('en-IN')}` : 'N/A',
            row.date ? new Date(row.date).toLocaleDateString('en-IN') : 'N/A',
            row.purpose || 'N/A',
            row.fdrAmount ? `${Number(row.fdrAmount).toLocaleString('en-IN')}` : 'N/A',
            row.fdrScheme || 'N/A'
        ]);

        doc.autoTable({
            startY: 55,
            head: [[
                { content: 'S.No', styles: { fillColor: [63, 81, 181], textColor: 255, fontStyle: 'bold' } },
                { content: 'Loan Type', styles: { fillColor: [63, 81, 181], textColor: 255, fontStyle: 'bold' } },
                { content: 'Membership No', styles: { fillColor: [63, 81, 181], textColor: 255, fontStyle: 'bold' } },
                { content: 'Amount', styles: { fillColor: [63, 81, 181], textColor: 255, fontStyle: 'bold' } },
                { content: 'Date', styles: { fillColor: [63, 81, 181], textColor: 255, fontStyle: 'bold' } },
                { content: 'Purpose', styles: { fillColor: [63, 81, 181], textColor: 255, fontStyle: 'bold' } },
                { content: 'FDR Amount', styles: { fillColor: [63, 81, 181], textColor: 255, fontStyle: 'bold' } },
                { content: 'FDR Scheme', styles: { fillColor: [63, 81, 181], textColor: 255, fontStyle: 'bold' } }
            ]],
            body: loanData,
            theme: 'grid',
            styles: { fontSize: 9, cellPadding: 3 },
            headStyles: { fillColor: [63, 81, 181] },
            alternateRowStyles: { fillColor: [245, 245, 245] },
        });

        // Footer
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(
                `Generated on ${new Date().toLocaleDateString()} | Page ${i} of ${totalPages}`,
                pageWidth / 2,
                doc.internal.pageSize.getHeight() - 10,
                { align: "center" }
            );
        }

        doc.save(`Loan_Details_${data.loan.membershipNumber || data.loan.lafMembershipNumber}_${new Date().getTime()}.pdf`);
    };

    // Function to download PDC PDF only
    const handleDownloadPDCPDF = () => {
        if (!data || !data.pdc || data.pdc.length === 0) return;

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // Header
        doc.setFillColor(156, 39, 176); // Purple color for PDC
        doc.rect(0, 0, pageWidth, 30, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont("helvetica", "bold");
        doc.text("PDC DETAILS", pageWidth / 2, 18, { align: "center" });

        // Member Information
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text(`Member: ${data.loan.membershipNumber || data.loan.lafMembershipNumber || 'N/A'}`, 14, 40);
        doc.text(`Total Cheques: ${data.pdc.length}`, 14, 47);

        const pdcData = data.pdc.map((row, index) => [
            index + 1,
            row.bankName || 'N/A',
            row.branch || 'N/A',
            row.ifsc || 'N/A',
            row.accountNumber || 'N/A',
            row.chequeNumber || 'N/A',
            row.chequeDate ? new Date(row.chequeDate).toLocaleDateString('en-IN') : 'N/A'
        ]);

        doc.autoTable({
            startY: 55,
            head: [[
                { content: 'S.No', styles: { fillColor: [156, 39, 176], textColor: 255, fontStyle: 'bold' } },
                { content: 'Bank Name', styles: { fillColor: [156, 39, 176], textColor: 255, fontStyle: 'bold' } },
                { content: 'Branch', styles: { fillColor: [156, 39, 176], textColor: 255, fontStyle: 'bold' } },
                { content: 'IFSC', styles: { fillColor: [156, 39, 176], textColor: 255, fontStyle: 'bold' } },
                { content: 'Account No', styles: { fillColor: [156, 39, 176], textColor: 255, fontStyle: 'bold' } },
                { content: 'Cheque No', styles: { fillColor: [156, 39, 176], textColor: 255, fontStyle: 'bold' } },
                { content: 'Cheque Date', styles: { fillColor: [156, 39, 176], textColor: 255, fontStyle: 'bold' } }
            ]],
            body: pdcData,
            theme: 'grid',
            styles: { fontSize: 9, cellPadding: 2 },
            headStyles: { fillColor: [156, 39, 176] },
            alternateRowStyles: { fillColor: [245, 245, 245] },
        });

        // Footer
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(
                `Generated on ${new Date().toLocaleDateString()} | Page ${i} of ${totalPages}`,
                pageWidth / 2,
                doc.internal.pageSize.getHeight() - 10,
                { align: "center" }
            );
        }

        doc.save(`PDC_Details_${data.loan.membershipNumber || data.loan.lafMembershipNumber}_${new Date().getTime()}.pdf`);
    };

    // Function to download Complete PDF (both Loan and PDC)
    const handleDownloadCompletePDF = () => {
        if (!data) return;

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();

        // Header
        doc.setFillColor(63, 81, 181);
        doc.rect(0, 0, pageWidth, 30, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont("helvetica", "bold");
        doc.text("LOAN & PDC DETAILS", pageWidth / 2, 18, { align: "center" });

        // Reset text color
        doc.setTextColor(0, 0, 0);

        // Loan Details Section
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("LOAN DETAILS", 14, 45);

        // Create loan details table for PDF
        const loanTableData = getLoanTableData();
        const loanData = loanTableData.map((row, index) => [
            index + 1,
            row.loanType || 'N/A',
            row.membershipNumber || 'N/A',
            row.amount ? `${Number(row.amount).toLocaleString('en-IN')}` : 'N/A',
            row.date ? new Date(row.date).toLocaleDateString('en-IN') : 'N/A',
            row.purpose || 'N/A',
            row.fdrAmount ? `${Number(row.fdrAmount).toLocaleString('en-IN')}` : 'N/A',
            row.fdrScheme || 'N/A'
        ]);

        doc.autoTable({
            startY: 50,
            head: [[
                { content: 'S.No', styles: { fillColor: [63, 81, 181], textColor: 255, fontStyle: 'bold' } },
                { content: 'Loan Type', styles: { fillColor: [63, 81, 181], textColor: 255, fontStyle: 'bold' } },
                { content: 'Membership No', styles: { fillColor: [63, 81, 181], textColor: 255, fontStyle: 'bold' } },
                { content: 'Amount', styles: { fillColor: [63, 81, 181], textColor: 255, fontStyle: 'bold' } },
                { content: 'Date', styles: { fillColor: [63, 81, 181], textColor: 255, fontStyle: 'bold' } },
                { content: 'Purpose', styles: { fillColor: [63, 81, 181], textColor: 255, fontStyle: 'bold' } },
                { content: 'FDR Amount', styles: { fillColor: [63, 81, 181], textColor: 255, fontStyle: 'bold' } },
                { content: 'FDR Scheme', styles: { fillColor: [63, 81, 181], textColor: 255, fontStyle: 'bold' } }
            ]],
            body: loanData,
            theme: 'grid',
            styles: { fontSize: 9, cellPadding: 3 },
            headStyles: { fillColor: [63, 81, 181] },
            alternateRowStyles: { fillColor: [245, 245, 245] },
        });

        // PDC Details Section
        if (data.pdc && data.pdc.length > 0) {
            const finalY = doc.lastAutoTable.finalY + 10;

            doc.setFontSize(16);
            doc.setFont("helvetica", "bold");
            doc.text("PDC DETAILS", 14, finalY);

            const pdcData = data.pdc.map((row, index) => [
                index + 1,
                row.bankName || 'N/A',
                row.branch || 'N/A',
                row.ifsc || 'N/A',
                row.accountNumber || 'N/A',
                row.chequeNumber || 'N/A',
                row.chequeDate ? new Date(row.chequeDate).toLocaleDateString('en-IN') : 'N/A'
            ]);

            doc.autoTable({
                startY: finalY + 5,
                head: [[
                    { content: 'S.No', styles: { fillColor: [63, 81, 181], textColor: 255, fontStyle: 'bold' } },
                    { content: 'Bank Name', styles: { fillColor: [63, 81, 181], textColor: 255, fontStyle: 'bold' } },
                    { content: 'Branch', styles: { fillColor: [63, 81, 181], textColor: 255, fontStyle: 'bold' } },
                    { content: 'IFSC', styles: { fillColor: [63, 81, 181], textColor: 255, fontStyle: 'bold' } },
                    { content: 'Account No', styles: { fillColor: [63, 81, 181], textColor: 255, fontStyle: 'bold' } },
                    { content: 'Cheque No', styles: { fillColor: [63, 81, 181], textColor: 255, fontStyle: 'bold' } },
                    { content: 'Cheque Date', styles: { fillColor: [63, 81, 181], textColor: 255, fontStyle: 'bold' } }
                ]],
                body: pdcData,
                theme: 'grid',
                styles: { fontSize: 9, cellPadding: 2 },
                headStyles: { fillColor: [63, 81, 181] },
                alternateRowStyles: { fillColor: [245, 245, 245] },
            });
        }

        // Footer
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(
                `Generated on ${new Date().toLocaleDateString()} | Page ${i} of ${totalPages}`,
                pageWidth / 2,
                doc.internal.pageSize.getHeight() - 10,
                { align: "center" }
            );
        }

        doc.save(`Complete_Details_${data.loan.membershipNumber}_${new Date().getTime()}.pdf`);
    };

    const loanTableData = getLoanTableData();
    const hasPDC = data?.pdc && data.pdc.length > 0;

    return (
        <Paper elevation={3} sx={{ p: 4, maxWidth: 1400, mx: "auto", mt: 4, mb: 4 }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight="bold" color="primary">
                    VIEW LOAN & PDC DETAILS
                </Typography>
                <Typography variant="subtitle1" color="text.secondary">
                    Comprehensive view of loan information and post-dated cheques
                </Typography>
            </Box>

            <Divider sx={{ mb: 4 }} />

            {/* Member Selection and Actions */}
            <Box sx={{ mb: 4, display: "flex", gap: 2, alignItems: "center", flexWrap: "wrap" }}>
                <FormControl sx={{ minWidth: 300 }} size="small">
                    <InputLabel id="member-select-label">Select Member</InputLabel>
                    <Select
                        labelId="member-select-label"
                        value={selectedMember}
                        label="Select Member"
                        onChange={handleMemberChange}
                    >
                        {allMembers.map((member) => (
                            <MenuItem key={member.membershipNumber} value={member.membershipNumber}>
                                <Box>
                                    <Typography variant="body2" fontWeight="bold">
                                        {member.membershipNumber}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {member.name}
                                    </Typography>
                                </Box>
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <Tooltip title="Add new loan for selected member">
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={handleAddNewLoan}
                        sx={{ minWidth: 160 }}
                    >
                        Add New Loan
                    </Button>
                </Tooltip>

                <Box sx={{ flexGrow: 1 }} />

                <Tooltip title="Download Complete Report">
                    <Button
                        variant="outlined"
                        startIcon={<Download />}
                        onClick={handleDownloadCompletePDF}
                        disabled={!data}
                    >
                        Export Complete PDF
                    </Button>
                </Tooltip>
            </Box>

            {!data ? (
                <Card sx={{ textAlign: "center", py: 6, bgcolor: 'grey.50' }}>
                    <CardContent>
                        <Typography variant="h6" color="text.secondary" gutterBottom>
                            No Loan Data Found
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                            No loan information available for the selected member
                        </Typography>
                        <Button
                            variant="contained"
                            onClick={handleAddNewLoan}
                            startIcon={<Add />}
                        >
                            Create New Loan
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Tabs for Loan and PDC */}
                    <Card sx={{ mb: 4 }}>
                        <CardContent sx={{ p: 0 }}>
                            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                                <Tabs
                                    value={activeTab}
                                    onChange={handleTabChange}
                                    sx={{
                                        '& .MuiTab-root': {
                                            fontWeight: 'bold',
                                            fontSize: '1rem',
                                            textTransform: 'none',
                                            minHeight: 60
                                        }
                                    }}
                                >
                                    <Tab
                                        label={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography fontWeight="bold">Loan Details</Typography>
                                                <Chip
                                                    label={loanTableData.length}
                                                    color="primary"
                                                    size="small"
                                                />
                                            </Box>
                                        }
                                    />
                                    <Tab
                                        label={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Typography fontWeight="bold">PDC Details</Typography>
                                                {hasPDC && (
                                                    <Chip
                                                        label={data.pdc.length}
                                                        color="secondary"
                                                        size="small"
                                                    />
                                                )}
                                            </Box>
                                        }
                                        disabled={!hasPDC}
                                    />
                                </Tabs>
                            </Box>

                            {/* Loan Details Tab Panel */}
                            <TabPanel value={activeTab} index={0}>
                                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                    <Tooltip title="Download Loan Details PDF">
                                        <Button
                                            variant="contained"
                                            startIcon={<Download />}
                                            onClick={handleDownloadLoanPDF}
                                            size="small"
                                        >
                                            Download Loan PDF
                                        </Button>
                                    </Tooltip>
                                </Box>
                                <TableContainer>
                                    <Table sx={{ minWidth: 1000 }}>
                                        <TableHead sx={{ bgcolor: 'primary.main' }}>
                                            <TableRow>
                                                <TableCell sx={{ color: 'white', fontWeight: 'bold', width: 80 }}>S.No</TableCell>
                                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Loan Type</TableCell>
                                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Membership No</TableCell>
                                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Amount</TableCell>
                                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Date</TableCell>
                                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Purpose</TableCell>
                                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>FDR Amount</TableCell>
                                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>FDR Scheme</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {loanTableData.map((row, index) => (
                                                <TableRow
                                                    key={index}
                                                    sx={{
                                                        '&:nth-of-type(odd)': { bgcolor: 'action.hover' },
                                                        '&:last-child td, &:last-child th': { border: 0 }
                                                    }}
                                                >
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight="medium" color="primary">
                                                            {row.sno}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={row.loanType || 'N/A'}
                                                            color="primary"
                                                            size="small"
                                                            variant="outlined"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" fontFamily="monospace" fontWeight="medium">
                                                            {row.membershipNumber || 'N/A'}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight="bold" color="success.dark" fontFamily="monospace">
                                                            {row.amount ? `₹${Number(row.amount).toLocaleString('en-IN')}` : 'N/A'}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2">
                                                            {row.date ? new Date(row.date).toLocaleDateString('en-IN') : 'N/A'}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" sx={{ maxWidth: 200 }}>
                                                            {row.purpose || 'N/A'}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" fontFamily="monospace">
                                                            {row.fdrAmount ? `₹${Number(row.fdrAmount).toLocaleString('en-IN')}` : 'N/A'}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2">
                                                            {row.fdrScheme || 'N/A'}
                                                        </Typography>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </TabPanel>

                            {/* PDC Details Tab Panel */}
                            <TabPanel value={activeTab} index={1}>
                                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                    <Tooltip title="Download PDC Details PDF">
                                        <Button
                                            variant="contained"
                                            color="secondary"
                                            startIcon={<Download />}
                                            onClick={handleDownloadPDCPDF}
                                            size="small"
                                        >
                                            Download PDC PDF
                                        </Button>
                                    </Tooltip>
                                </Box>
                                {hasPDC ? (
                                    <TableContainer>
                                        <Table sx={{ minWidth: 1000 }}>
                                            <TableHead sx={{ bgcolor: 'secondary.main' }}>
                                                <TableRow>
                                                    <TableCell sx={{ color: 'white', fontWeight: 'bold', width: 80 }}>S.No</TableCell>
                                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Bank Name</TableCell>
                                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Branch</TableCell>
                                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>IFSC Code</TableCell>
                                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Account Number</TableCell>
                                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Cheque Number</TableCell>
                                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Cheque Date</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {data.pdc.map((row, index) => (
                                                    <TableRow
                                                        key={index}
                                                        sx={{
                                                            '&:nth-of-type(odd)': { bgcolor: 'action.hover' },
                                                            '&:last-child td, &:last-child th': { border: 0 }
                                                        }}
                                                    >
                                                        <TableCell>
                                                            <Typography variant="body2" fontWeight="medium" color="primary">
                                                                {index + 1}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2" fontWeight="medium">
                                                                {row.bankName || 'N/A'}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2">
                                                                {row.branch || 'N/A'}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2" fontFamily="monospace">
                                                                {row.ifsc || 'N/A'}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2" fontFamily="monospace">
                                                                {row.accountNumber || 'N/A'}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2" fontFamily="monospace">
                                                                {row.chequeNumber || 'N/A'}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2" fontWeight="medium">
                                                                {row.chequeDate ? new Date(row.chequeDate).toLocaleDateString('en-IN') : 'N/A'}
                                                            </Typography>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                ) : (
                                    <Box sx={{ textAlign: 'center', py: 6 }}>
                                        <Typography variant="h6" color="text.secondary">
                                            No PDC Details Available
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                            There are no post-dated cheques for this loan.
                                        </Typography>
                                    </Box>
                                )}
                            </TabPanel>
                        </CardContent>
                    </Card>

                    {/* Action Buttons */}
                    <Box sx={{ mt: 4, display: "flex", justifyContent: "center", gap: 2, flexWrap: "wrap" }}>
                        <Button
                            variant="outlined"
                            startIcon={<ArrowBack />}
                            onClick={() => navigate("/loan")}
                        >
                            Back to Loan Form
                        </Button>

                    </Box>
                </>
            )}
        </Paper>
    );
};

export default LoanView;