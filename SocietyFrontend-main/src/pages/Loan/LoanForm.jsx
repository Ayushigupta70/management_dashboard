import React, { useState, useEffect } from "react";
import {
    Box,
    Grid,
    Typography,
    TextField,
    MenuItem,
    Paper,
    Divider,
    Button,
} from "@mui/material";
import { useNavigate } from "react-router-dom";

const STORAGE_KEY = "loan_pdc_app_all";

const LoanForm = () => {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        loanType: "",
        membershipNumber: "",
        loanDate: "",
        loanAmount: "",
        purpose: "",
        lafMembershipNumber: "",
        lafDate: "",
        lafAmount: "",
        fdrAmount: "",
        fdrScheme: "",
    });

    const [allLoans, setAllLoans] = useState({}); // object with membershipNumber as key
    const [selectedMember, setSelectedMember] = useState("");

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                setAllLoans(data);
            } catch (e) {
                console.error(e);
            }
        }
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const FormRow = ({ number, label, children }) => (
        <Grid container alignItems="center" spacing={2} sx={{ py: 1, borderBottom: "1px solid #e0e0e0" }}>
            <Grid item xs={1.2}><Typography fontWeight={600}>{number}</Typography></Grid>
            <Grid item xs={4}><Typography fontWeight={600}>{label}</Typography></Grid>
            <Grid item xs={6.8}>{children}</Grid>
        </Grid>
    );

    const handleNext = () => {
        // Save current form to localStorage under STORAGE_KEY
        const membership = form.membershipNumber;
        const updatedLoans = { ...allLoans, [membership]: { loan: form, pdc: [] } };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedLoans));
        navigate("/pdc", { state: form });
    };

    const handleView = () => {
        if (!selectedMember) return alert("Select a member to view details.");
        navigate("/view-loan", { state: { membershipNumber: selectedMember } });
    };

    return (
        <Paper elevation={3} sx={{ p: 4, maxWidth: 950, mx: "auto", mt: 4 }}>
            <Typography variant="h4" textAlign="center" fontWeight="bold" mb={2}>
                LOAN DETAILS FORM
            </Typography>

            <Divider sx={{ mb: 3 }} />

            {/* Loan Type */}
            <Box display="flex" alignItems="center" gap={4} mt={3}>
                {/* Loan Type */}
                <TextField
                    select
                    size="small"
                    label="Type of Loan"
                    name="loanType"
                    value={form.loanType}
                    onChange={handleChange}
                    sx={{ minWidth: 180 }}
                >
                    <MenuItem value="Loan">Loan</MenuItem>
                    <MenuItem value="LAF">LAF</MenuItem>
                    <MenuItem value="LAP">LAP</MenuItem>
                </TextField>

                <TextField
                    select
                    size="small"
                    label="View Member Details"
                    value={selectedMember}
                    onChange={(e) => setSelectedMember(e.target.value)}
                    sx={{ minWidth: 200 }}
                >
                    {Object.keys(allLoans).map((member) => (
                        <MenuItem key={member} value={member}>{member}</MenuItem>
                    ))}
                </TextField>

                <Button variant="outlined" onClick={handleView} sx={{ height: 40 }}>
                    View
                </Button>
            </Box>


            {(form.loanType === "Loan" || form.loanType === "LAP") && (
                <>
                    <FormRow number="1" label="Membership Number">
                        <TextField size="small" fullWidth name="membershipNumber" value={form.membershipNumber} onChange={handleChange} />
                    </FormRow>
                    <FormRow number="2" label="Loan Date">
                        <TextField type="date" size="small" fullWidth name="loanDate" value={form.loanDate} onChange={handleChange} />
                    </FormRow>
                    <FormRow number="3" label="Loan Amount">
                        <TextField type="number" size="small" fullWidth name="loanAmount" value={form.loanAmount} onChange={handleChange} />
                    </FormRow>
                    <FormRow number="4" label="Purpose">
                        <TextField size="small" fullWidth name="purpose" value={form.purpose} onChange={handleChange} />
                    </FormRow>
                </>
            )}

            {form.loanType === "LAF" && (
                <>
                    <Typography mt={3} mb={1} fontWeight="bold">LAF DETAILS</Typography>
                    <Divider sx={{ mb: 2 }} />
                    <FormRow number="1" label="LAF Member No">
                        <TextField size="small" fullWidth name="lafMembershipNumber" value={form.lafMembershipNumber} onChange={handleChange} />
                    </FormRow>
                    <FormRow number="2" label="LAF Date">
                        <TextField type="date" size="small" fullWidth name="lafDate" value={form.lafDate} onChange={handleChange} />
                    </FormRow>
                    <FormRow number="3" label="LAF Amount">
                        <TextField type="number" size="small" fullWidth name="lafAmount" value={form.lafAmount} onChange={handleChange} />
                    </FormRow>
                    <FormRow number="4" label="FDR Amount">
                        <TextField type="number" fullWidth size="small" name="fdrAmount" value={form.fdrAmount} onChange={handleChange} />
                    </FormRow>
                    <FormRow number="5" label="FDR Scheme">
                        <TextField fullWidth size="small" name="fdrScheme" value={form.fdrScheme} onChange={handleChange} />
                    </FormRow>

                </>
            )}

            <Box textAlign="center" mt={4} display="flex" justifyContent="center" alignItems="center" gap={2}>
                <Button variant="contained" sx={{ px: 5, py: 1.3 }} onClick={handleNext}>Next</Button>
            </Box>

        </Paper>
    );
};

export default LoanForm;
