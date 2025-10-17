/**
 * Complaints & Claims Desk Application
 * Pure JavaScript implementation with Bootstrap styling
 * Following industry best practices for maintainability and performance
 */

'use strict';

// Application State Management
class AppState {
    constructor() {
        this.tickets = [];
        this.activeTicketId = null;
        this.currentTab = 'portal';
        this.searchQuery = '';
        this.listeners = new Map();
        
        // Initialize with seed data
        this.initializeSeedData();
    }

    // State mutation methods
    setState(key, value) {
        const oldValue = this[key];
        this[key] = value;
        this.notify(key, value, oldValue);
    }

    getState(key) {
        return this[key];
    }

    // Observable pattern implementation
    subscribe(key, callback) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, []);
        }
        this.listeners.get(key).push(callback);
    }

    notify(key, newValue, oldValue) {
        if (this.listeners.has(key)) {
            this.listeners.get(key).forEach(callback => {
                try {
                    callback(newValue, oldValue);
                } catch (error) {
                    console.error('Error in state listener:', error);
                }
            });
        }
    }

    // Initialize with seed data
    initializeSeedData() {
        const seedTicket = {
            id: 'T-1001',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            nature: 'Damage',
            informedTiming: 'Before leaving official ground',
            customer: {
                name: 'John Hamilton',
                email: 'john@example.com',
                phone: '+447700900001',
                address: '10 Bay Rd, TW6'
            },
            booking: {
                reg: 'AB12CDE',
                terminal: 'T5',
                driverName: 'A. Singh'
            },
            complaint: {
                damageTypes: ['Scratch'],
                description: 'Scratch near rear bumper.',
                images: [{
                    id: 'e1',
                    kind: 'image',
                    name: 'rear_bumper.jpg',
                    takenAt: '2025-09-20T14:05:00Z'
                }],
                videos: [],
                customerNotifiedDriver: true,
                incidentDate: '2025-09-20'
            },
            admin: {
                findings: 'Light surface scratch.',
                supportingDocs: [],
                supportingImages: [],
                supportingVideos: [],
                outcome: undefined,
                repair: undefined
            },
            status: 'Triage',
            audit: [{
                at: new Date(Date.now() - 86000000).toISOString(),
                who: 'system',
                action: 'Ticket created'
            }]
        };

        this.tickets = [seedTicket];
        this.activeTicketId = seedTicket.id;
    }

    // Ticket management methods
    addTicket(ticket) {
        this.tickets.unshift(ticket);
        this.notify('tickets', this.tickets);
    }

    updateTicket(ticketId, updater) {
        const index = this.tickets.findIndex(t => t.id === ticketId);
        if (index !== -1) {
            this.tickets[index] = updater({ ...this.tickets[index] });
            this.notify('tickets', this.tickets);
        }
    }

    getTicket(ticketId) {
        return this.tickets.find(t => t.id === ticketId);
    }

    getActiveTicket() {
        return this.getTicket(this.activeTicketId);
    }

    // Filter tickets based on search query
    getFilteredTickets() {
        if (!this.searchQuery.trim()) {
            return this.tickets;
        }

        const query = this.searchQuery.toLowerCase();
        return this.tickets.filter(ticket => 
            ticket.id.toLowerCase().includes(query) ||
            ticket.customer.name.toLowerCase().includes(query) ||
            (ticket.booking?.reg || '').toLowerCase().includes(query) ||
            ticket.status.toLowerCase().includes(query)
        );
    }
}

// Utility Functions
const Utils = {
    // Generate new ticket ID
    generateTicketId() {
        return 'T-' + Math.floor(1000 + Math.random() * 9000);
    },

    // Format date for display
    formatDate(dateString) {
        if (!dateString) return 'n/a';
        try {
            return new Date(dateString).toLocaleString();
        } catch {
            return 'Invalid date';
        }
    },

    // Format date for input fields
    formatDateForInput(dateString) {
        if (!dateString) return '';
        try {
            return new Date(dateString).toISOString().split('T')[0];
        } catch {
            return '';
        }
    },

    // Debounce function for search
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Sanitize HTML to prevent XSS
    sanitizeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    // Calculate average
    calculateAverage(numbers) {
        if (!numbers.length) return 0;
        const sum = numbers.reduce((a, b) => a + b, 0);
        return Math.round((sum / numbers.length) * 100) / 100;
    },

    // Get status badge class
    getStatusBadgeClass(status) {
        const statusMap = {
            'New': 'status-new bg-info',
            'Triage': 'status-triage bg-warning',
            'Investigating': 'status-investigating bg-primary',
            'Awaiting Customer': 'status-awaiting bg-warning',
            'Repair Scheduled': 'status-repair bg-info',
            'Resolved': 'status-resolved bg-success',
            'Rejected': 'status-rejected bg-danger'
        };
        return statusMap[status] || 'bg-light';
    }
};

// Validation Module
const Validation = {
    // Form validation rules
    rules: {
        required: (value) => value.trim().length > 0,
        email: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
        phone: (value) => /^[\+]?[0-9\s\-\(\)]+$/.test(value),
        minLength: (min) => (value) => value.trim().length >= min
    },

    // Validate form
    validateForm(formElement) {
        const errors = {};
        const inputs = formElement.querySelectorAll('input[required], textarea[required], select[required]');

        inputs.forEach(input => {
            const value = input.value;
            const name = input.name || input.id;

            // Clear previous validation
            input.classList.remove('is-invalid');
            const feedback = input.parentNode.querySelector('.invalid-feedback');
            if (feedback) {
                feedback.remove();
            }

            // Required validation
            if (input.hasAttribute('required') && !this.rules.required(value)) {
                errors[name] = 'This field is required';
            }

            // Type-specific validation
            if (value && input.type === 'email' && !this.rules.email(value)) {
                errors[name] = 'Please enter a valid email address';
            }

            if (value && input.type === 'tel' && !this.rules.phone(value)) {
                errors[name] = 'Please enter a valid phone number';
            }
        });

        return errors;
    },

    // Display validation errors
    displayErrors(errors) {
        Object.keys(errors).forEach(fieldName => {
            const field = document.getElementById(fieldName) || document.querySelector(`[name="${fieldName}"]`);
            if (field) {
                field.classList.add('is-invalid');
                
                const feedback = document.createElement('div');
                feedback.className = 'invalid-feedback';
                feedback.textContent = errors[fieldName];
                field.parentNode.appendChild(feedback);
            }
        });
    },

    // Clear all validation errors
    clearErrors(formElement) {
        const invalidFields = formElement.querySelectorAll('.is-invalid');
        const feedbacks = formElement.querySelectorAll('.invalid-feedback');
        
        invalidFields.forEach(field => field.classList.remove('is-invalid'));
        feedbacks.forEach(feedback => feedback.remove());
    }
};

// Toast Notification System
const NotificationSystem = {
    show(message, type = 'success', title = '') {
        const toast = document.getElementById('notification-toast');
        const toastTitle = document.getElementById('toast-title');
        const toastMessage = document.getElementById('toast-message');
        const toastIcon = document.getElementById('toast-icon');

        // Set icon and title based on type
        const config = {
            success: { icon: 'bi-check-circle-fill text-success', title: title || 'Success' },
            error: { icon: 'bi-exclamation-triangle-fill text-danger', title: title || 'Error' },
            warning: { icon: 'bi-exclamation-triangle-fill text-warning', title: title || 'Warning' },
            info: { icon: 'bi-info-circle-fill text-info', title: title || 'Info' }
        };

        const settings = config[type] || config.info;
        toastIcon.className = `${settings.icon} me-2`;
        toastTitle.textContent = settings.title;
        toastMessage.textContent = message;

        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
    }
};

// Error Boundary System
const ErrorBoundary = {
    init() {
        window.addEventListener('error', this.handleError.bind(this));
        window.addEventListener('unhandledrejection', this.handlePromiseRejection.bind(this));
    },

    handleError(event) {
        console.error('Global error caught:', event.error);
        this.showError(event.error);
    },

    handlePromiseRejection(event) {
        console.error('Unhandled promise rejection:', event.reason);
        this.showError(event.reason);
    },

    showError(error) {
        const errorBoundary = document.getElementById('error-boundary');
        const errorMessage = document.getElementById('error-message');
        
        errorMessage.textContent = error.toString();
        errorBoundary.classList.remove('d-none');
        
        // Auto-hide after 10 seconds
        setTimeout(() => {
            errorBoundary.classList.add('d-none');
        }, 10000);
    }
};

// Main Application Class
class ComplaintsDeskApp {
    constructor() {
        this.state = new AppState();
        this.initializeEventListeners();
        this.initializeStateSubscriptions();
        this.render();
    }

    initializeEventListeners() {
        // Tab switching
        document.getElementById('tab-selector').addEventListener('change', (e) => {
            this.switchTab(e.target.value);
        });

        // Search functionality
        const searchInput = document.getElementById('search-input');
        searchInput.addEventListener('input', Utils.debounce((e) => {
            this.state.setState('searchQuery', e.target.value);
        }, 300));

        // Complaint form submission
        document.getElementById('complaint-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleComplaintSubmission();
        });

        // Complaint nature change
        document.getElementById('complaint-nature').addEventListener('change', (e) => {
            this.toggleDamageFields(e.target.value === 'Damage');
        });

        // Damage types change
        document.getElementById('damage-types').addEventListener('change', (e) => {
            if (e.target.type === 'checkbox') {
                this.updateTimingSection();
            }
        });

        // Ticket details form changes
        this.initializeTicketDetailsListeners();
    }

    initializeTicketDetailsListeners() {
        // Findings textarea
        const findingsText = document.getElementById('findings-text');
        if (findingsText) {
            findingsText.addEventListener('blur', () => {
                const activeTicket = this.state.getActiveTicket();
                if (activeTicket) {
                    this.state.updateTicket(activeTicket.id, (ticket) => {
                        ticket.admin.findings = findingsText.value;
                        return ticket;
                    });
                }
            });
        }

        // Decision select
        const decisionSelect = document.getElementById('decision-select');
        if (decisionSelect) {
            decisionSelect.addEventListener('change', () => {
                this.updateTicketOutcome();
            });
        }

        // Solution text
        const solutionText = document.getElementById('solution-text');
        if (solutionText) {
            solutionText.addEventListener('blur', () => {
                this.updateTicketOutcome();
            });
        }

        // Reject reason
        const rejectReason = document.getElementById('reject-reason');
        if (rejectReason) {
            rejectReason.addEventListener('blur', () => {
                const activeTicket = this.state.getActiveTicket();
                if (activeTicket) {
                    this.state.updateTicket(activeTicket.id, (ticket) => {
                        if (!ticket.admin.outcome) {
                            ticket.admin.outcome = { decision: ticket.status };
                        }
                        ticket.admin.outcome.rejectReason = rejectReason.value;
                        return ticket;
                    });
                }
            });
        }

        // Liability accepted checkbox
        const liabilityAccepted = document.getElementById('liability-accepted');
        if (liabilityAccepted) {
            liabilityAccepted.addEventListener('change', () => {
                const activeTicket = this.state.getActiveTicket();
                if (activeTicket) {
                    this.state.updateTicket(activeTicket.id, (ticket) => {
                        if (!ticket.admin.outcome) {
                            ticket.admin.outcome = { decision: ticket.status };
                        }
                        ticket.admin.outcome.liabilityAccepted = liabilityAccepted.checked;
                        return ticket;
                    });
                    
                    // Show/hide customer scheduling section
                    const customerScheduling = document.getElementById('customer-scheduling');
                    if (customerScheduling) {
                        customerScheduling.classList.toggle('d-none', !liabilityAccepted.checked);
                    }
                }
            });
        }

        // False claim flag
        const falseClaimFlag = document.getElementById('false-claim-flag');
        if (falseClaimFlag) {
            falseClaimFlag.addEventListener('change', () => {
                const activeTicket = this.state.getActiveTicket();
                if (activeTicket) {
                    this.state.updateTicket(activeTicket.id, (ticket) => {
                        if (!ticket.admin.outcome) {
                            ticket.admin.outcome = { decision: ticket.status };
                        }
                        ticket.admin.outcome.falseClaimFlag = falseClaimFlag.checked;
                        return ticket;
                    });
                }
            });
        }

        // Repair form fields
        this.initializeRepairFormListeners();
    }

    initializeRepairFormListeners() {
        const repairFields = [
            'repairer', 'claim-amount', 'timeframe-days', 'scheduled-date',
            'scheduled-window', 'preferred-time', 'parking-available', 'power-available'
        ];

        repairFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                const eventType = field.type === 'checkbox' ? 'change' : 'blur';
                field.addEventListener(eventType, () => {
                    this.updateRepairInfo();
                });
            }
        });
    }

    initializeStateSubscriptions() {
        this.state.subscribe('tickets', () => {
            this.renderTicketsList();
            this.renderReports();
            this.renderTicketDetails();
        });

        this.state.subscribe('activeTicketId', () => {
            this.renderTicketDetails();
            this.renderTicketsList(); // Re-render to update active state
        });

        this.state.subscribe('searchQuery', () => {
            this.renderTicketsList();
        });
    }

    switchTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.add('d-none');
        });

        // Show selected tab
        const targetTab = document.getElementById(`${tabName}-tab`);
        if (targetTab) {
            targetTab.classList.remove('d-none');
            this.state.setState('currentTab', tabName);
            
            // Render tab-specific content
            if (tabName === 'desk') {
                this.renderTicketsList();
                this.renderTicketDetails();
            } else if (tabName === 'reports') {
                this.renderReports();
            }
        }
    }

    toggleDamageFields(show) {
        const damageFields = document.getElementById('damage-fields');
        if (damageFields) {
            damageFields.classList.toggle('d-none', !show);
        }
    }

    updateTimingSection() {
        const damageCheckboxes = document.querySelectorAll('#damage-types input[type="checkbox"]:checked');
        const timingSection = document.getElementById('timing-section');
        
        if (timingSection) {
            timingSection.classList.toggle('d-none', damageCheckboxes.length === 0);
        }
    }

    handleComplaintSubmission() {
        const form = document.getElementById('complaint-form');
        
        // Clear previous validation
        Validation.clearErrors(form);

        // Validate form
        const errors = Validation.validateForm(form);

        // Custom validation for damage complaints
        const nature = document.getElementById('complaint-nature').value;
        if (nature === 'Damage') {
            const damageTypes = Array.from(document.querySelectorAll('#damage-types input:checked')).map(cb => cb.value);
            if (damageTypes.length === 0) {
                errors['damage-types'] = 'At least one damage type is required for damage complaints';
            }
        }

        // Display errors if any
        if (Object.keys(errors).length > 0) {
            Validation.displayErrors(errors);
            NotificationSystem.show('Please correct the errors in the form', 'error');
            return;
        }

        // Create ticket
        const ticketData = this.collectComplaintFormData();
        const newTicket = this.createTicketFromComplaint(ticketData);
        
        this.state.addTicket(newTicket);
        this.state.setState('activeTicketId', newTicket.id);
        this.switchTab('desk');
        
        // Reset form
        form.reset();
        this.toggleDamageFields(false);
        
        NotificationSystem.show(`Ticket ${newTicket.id} created successfully`, 'success');
    }

    collectComplaintFormData() {
        const damageTypes = Array.from(document.querySelectorAll('#damage-types input:checked')).map(cb => cb.value);
        const informedTiming = document.querySelector('input[name="informed-timing"]:checked')?.value;

        return {
            nature: document.getElementById('complaint-nature').value,
            informedTiming: informedTiming,
            customer: {
                name: document.getElementById('customer-name').value,
                email: document.getElementById('customer-email').value,
                phone: document.getElementById('customer-phone').value,
                address: document.getElementById('customer-address').value
            },
            booking: {
                reg: document.getElementById('vehicle-reg').value,
                terminal: document.getElementById('terminal').value,
                driverName: document.getElementById('driver-name').value
            },
            complaint: {
                damageTypes: damageTypes,
                description: document.getElementById('complaint-description').value,
                incidentDate: document.getElementById('incident-date').value,
                customerNotifiedDriver: document.getElementById('notified-driver').checked
            }
        };
    }

    createTicketFromComplaint(data) {
        return {
            id: Utils.generateTicketId(),
            createdAt: new Date().toISOString(),
            nature: data.nature,
            informedTiming: data.informedTiming,
            customer: data.customer,
            booking: data.booking,
            complaint: {
                ...data.complaint,
                images: [],
                videos: []
            },
            admin: {
                findings: undefined,
                supportingDocs: [],
                supportingImages: [],
                supportingVideos: [],
                outcome: undefined,
                repair: undefined
            },
            status: 'New',
            audit: [{
                at: new Date().toISOString(),
                who: 'customer',
                action: 'Ticket created via portal'
            }]
        };
    }

    renderTicketsList() {
        const ticketsList = document.getElementById('tickets-list');
        if (!ticketsList) return;

        const tickets = this.state.getFilteredTickets();
        
        if (tickets.length === 0) {
            ticketsList.innerHTML = `
                <div class="list-group-item text-center text-muted py-4">
                    <i class="bi bi-inbox display-4 d-block mb-2"></i>
                    No tickets found
                </div>
            `;
            return;
        }

        ticketsList.innerHTML = tickets.map(ticket => `
            <div class="list-group-item list-group-item-action tickets-list-item ${ticket.id === this.state.activeTicketId ? 'active' : ''}"
                 data-ticket-id="${ticket.id}" role="button" tabindex="0">
                <div class="d-flex justify-content-between align-items-center mb-1">
                    <span class="fw-medium">${Utils.sanitizeHtml(ticket.id)}</span>
                    <span class="badge ${Utils.getStatusBadgeClass(ticket.status)}">${Utils.sanitizeHtml(ticket.status)}</span>
                </div>
                <div class="small text-muted mb-1">
                    ${Utils.sanitizeHtml(ticket.customer.name)} • ${Utils.sanitizeHtml(ticket.booking?.reg || 'no reg')}
                </div>
                <div class="small text-muted">
                    ${Utils.formatDate(ticket.createdAt)} • ${Utils.sanitizeHtml(ticket.nature)}
                </div>
            </div>
        `).join('');

        // Add click handlers
        ticketsList.addEventListener('click', (e) => {
            const ticketItem = e.target.closest('.tickets-list-item');
            if (ticketItem) {
                const ticketId = ticketItem.dataset.ticketId;
                this.state.setState('activeTicketId', ticketId);
            }
        });

        // Add keyboard navigation
        ticketsList.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const ticketItem = e.target.closest('.tickets-list-item');
                if (ticketItem) {
                    const ticketId = ticketItem.dataset.ticketId;
                    this.state.setState('activeTicketId', ticketId);
                }
            }
        });
    }

    renderTicketDetails() {
        const activeTicket = this.state.getActiveTicket();
        const ticketDetails = document.getElementById('ticket-details');
        const noTicketSelected = document.getElementById('no-ticket-selected');

        if (!activeTicket) {
            if (ticketDetails) ticketDetails.classList.add('d-none');
            if (noTicketSelected) noTicketSelected.classList.remove('d-none');
            return;
        }

        if (ticketDetails) ticketDetails.classList.remove('d-none');
        if (noTicketSelected) noTicketSelected.classList.add('d-none');

        this.updateTicketOverview(activeTicket);
        this.updateEvidenceSection(activeTicket);
        this.updateOutcomeSection(activeTicket);
        this.updateRepairSection(activeTicket);
        this.updateAuditLog(activeTicket);
    }

    updateTicketOverview(ticket) {
        // Update ticket title and status
        const titleElement = document.getElementById('ticket-title');
        const statusBadge = document.getElementById('ticket-status-badge');
        
        if (titleElement) titleElement.textContent = `Ticket ${ticket.id}`;
        if (statusBadge) {
            statusBadge.className = `badge ${Utils.getStatusBadgeClass(ticket.status)}`;
            statusBadge.textContent = ticket.status;
        }

        // Update customer info
        const customerInfo = document.getElementById('customer-info');
        if (customerInfo) {
            customerInfo.innerHTML = `
                <div class="fw-medium">${Utils.sanitizeHtml(ticket.customer.name)}</div>
                <div class="small text-muted">${Utils.sanitizeHtml(ticket.customer.phone)} • ${Utils.sanitizeHtml(ticket.customer.email || 'no email')}</div>
                <div class="small text-muted">${Utils.sanitizeHtml(ticket.customer.address || 'no address')}</div>
            `;
        }

        // Update booking info
        const bookingInfo = document.getElementById('booking-info');
        if (bookingInfo) {
            bookingInfo.innerHTML = `
                <div>Reg: ${Utils.sanitizeHtml(ticket.booking?.reg || 'n/a')}</div>
                <div>Terminal: ${Utils.sanitizeHtml(ticket.booking?.terminal || 'n/a')}</div>
                <div>Driver: ${Utils.sanitizeHtml(ticket.booking?.driverName || 'n/a')}</div>
            `;
        }

        // Update complaint info
        const complaintInfo = document.getElementById('complaint-info');
        if (complaintInfo) {
            const damageTypesHtml = ticket.nature === 'Damage' && ticket.complaint.damageTypes.length > 0
                ? ticket.complaint.damageTypes.map(type => `<span class="damage-type-pill">${Utils.sanitizeHtml(type)}</span>`).join(' ')
                : '';

            complaintInfo.innerHTML = `
                <div class="small text-muted mb-1">
                    Nature: ${Utils.sanitizeHtml(ticket.nature)}${ticket.informedTiming ? ` • ${Utils.sanitizeHtml(ticket.informedTiming)}` : ''}
                </div>
                <div class="mb-2">${Utils.sanitizeHtml(ticket.complaint.description || '—')}</div>
                ${damageTypesHtml ? `<div class="mb-2">${damageTypesHtml}</div>` : ''}
                <div class="small text-muted">
                    Incident date: ${Utils.sanitizeHtml(ticket.complaint.incidentDate || 'n/a')} • 
                    Notified driver: ${ticket.complaint.customerNotifiedDriver ? 'Yes' : 'No'}
                </div>
            `;
        }
    }

    updateEvidenceSection(ticket) {
        // Update customer images
        this.updateEvidenceList('customer-images', ticket.complaint.images);
        
        // Update customer videos
        this.updateEvidenceList('customer-videos', ticket.complaint.videos);
        
        // Update supporting evidence
        this.updateEvidenceList('supporting-images', ticket.admin.supportingImages);
        this.updateEvidenceList('supporting-videos', ticket.admin.supportingVideos);
        this.updateEvidenceList('supporting-docs', ticket.admin.supportingDocs);

        // Update findings textarea
        const findingsText = document.getElementById('findings-text');
        if (findingsText) {
            findingsText.value = ticket.admin.findings || '';
        }
    }

    updateEvidenceList(containerId, evidenceList) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (evidenceList.length === 0) {
            container.innerHTML = '<div class="small text-muted">No items</div>';
            return;
        }

        container.innerHTML = evidenceList.map(evidence => `
            <div class="evidence-item">
                <div class="small fw-medium">${Utils.sanitizeHtml(evidence.name)}</div>
                ${evidence.takenAt ? `<div class="small text-muted">Taken: ${Utils.formatDate(evidence.takenAt)}</div>` : ''}
            </div>
        `).join('');
    }

    updateOutcomeSection(ticket) {
        const decisionSelect = document.getElementById('decision-select');
        const solutionText = document.getElementById('solution-text');
        const rejectReason = document.getElementById('reject-reason');
        const falseClaimFlag = document.getElementById('false-claim-flag');
        const liabilityAccepted = document.getElementById('liability-accepted');

        if (decisionSelect) {
            decisionSelect.value = ticket.admin.outcome?.decision || ticket.status;
        }

        if (solutionText) {
            solutionText.value = ticket.admin.outcome?.solution || '';
        }

        if (rejectReason) {
            rejectReason.value = ticket.admin.outcome?.rejectReason || '';
        }

        if (falseClaimFlag) {
            falseClaimFlag.checked = ticket.admin.outcome?.falseClaimFlag || false;
        }

        if (liabilityAccepted) {
            liabilityAccepted.checked = ticket.admin.outcome?.liabilityAccepted || false;
        }

        // Show/hide customer scheduling section
        const customerScheduling = document.getElementById('customer-scheduling');
        if (customerScheduling) {
            customerScheduling.classList.toggle('d-none', !ticket.admin.outcome?.liabilityAccepted);
        }
    }

    updateRepairSection(ticket) {
        const repairFields = {
            'repairer': ticket.admin.repair?.repairer || '',
            'claim-amount': ticket.admin.repair?.claimAmount || '',
            'timeframe-days': ticket.admin.repair?.timeframeDays || '',
            'scheduled-date': Utils.formatDateForInput(ticket.admin.repair?.scheduledDate) || '',
            'scheduled-window': ticket.admin.repair?.scheduledWindow || '',
            'preferred-time': ticket.admin.repair?.preferredTime || '',
            'parking-available': ticket.admin.repair?.parkingAvailable || false,
            'power-available': ticket.admin.repair?.powerAvailable || false
        };

        Object.entries(repairFields).forEach(([fieldId, value]) => {
            const field = document.getElementById(fieldId);
            if (field) {
                if (field.type === 'checkbox') {
                    field.checked = value;
                } else {
                    field.value = value;
                }
            }
        });
    }

    updateAuditLog(ticket) {
        const auditLog = document.getElementById('audit-log');
        if (!auditLog) return;

        if (!ticket.audit || ticket.audit.length === 0) {
            auditLog.innerHTML = '<div class="text-muted">No audit entries</div>';
            return;
        }

        auditLog.innerHTML = ticket.audit.map(entry => `
            <div class="audit-entry">
                ${Utils.formatDate(entry.at)} — ${Utils.sanitizeHtml(entry.who)}: ${Utils.sanitizeHtml(entry.action)}
            </div>
        `).join('');
    }

    updateTicketOutcome() {
        const activeTicket = this.state.getActiveTicket();
        if (!activeTicket) return;

        const decision = document.getElementById('decision-select').value;
        const solution = document.getElementById('solution-text').value;

        this.state.updateTicket(activeTicket.id, (ticket) => {
            if (!ticket.admin.outcome) {
                ticket.admin.outcome = { decision };
            }
            ticket.admin.outcome.decision = decision;
            ticket.admin.outcome.solution = solution;

            // Add audit entry
            ticket.audit.push({
                at: new Date().toISOString(),
                who: 'agent',
                action: `Outcome updated: ${decision}`
            });

            return ticket;
        });
    }

    updateRepairInfo() {
        const activeTicket = this.state.getActiveTicket();
        if (!activeTicket) return;

        const repairData = {
            repairer: document.getElementById('repairer').value,
            claimAmount: parseFloat(document.getElementById('claim-amount').value) || undefined,
            timeframeDays: parseInt(document.getElementById('timeframe-days').value) || undefined,
            scheduledDate: document.getElementById('scheduled-date').value || undefined,
            scheduledWindow: document.getElementById('scheduled-window').value,
            preferredTime: document.getElementById('preferred-time').value,
            parkingAvailable: document.getElementById('parking-available').checked,
            powerAvailable: document.getElementById('power-available').checked
        };

        this.state.updateTicket(activeTicket.id, (ticket) => {
            ticket.admin.repair = { ...ticket.admin.repair, ...repairData };
            return ticket;
        });
    }

    renderReports() {
        const tickets = this.state.getState('tickets');
        
        // Calculate statistics
        const openTickets = tickets.filter(t => !['Resolved', 'Rejected'].includes(t.status)).length;
        const resolvedTickets = tickets.filter(t => t.status === 'Resolved').length;
        const rejectedTickets = tickets.filter(t => t.status === 'Rejected').length;
        
        const claimAmounts = tickets
            .map(t => t.admin.repair?.claimAmount)
            .filter(amount => amount !== undefined && amount > 0);
        const avgClaim = Utils.calculateAverage(claimAmounts);

        // Update DOM
        const reportElements = {
            'report-open': openTickets,
            'report-resolved': resolvedTickets,
            'report-rejected': rejectedTickets,
            'report-avg-claim': avgClaim
        };

        Object.entries(reportElements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }

    render() {
        // Initial render
        this.switchTab(this.state.currentTab);
        this.runSelfTests();
    }

    runSelfTests() {
        const testResults = document.getElementById('test-results');
        if (!testResults) return;

        const tests = [
            {
                name: 'Ticket ID generation',
                test: () => {
                    const id = Utils.generateTicketId();
                    if (!/^T-\d{4}$/.test(id)) throw new Error('Invalid ID format');
                }
            },
            {
                name: 'Average calculation',
                test: () => {
                    if (Utils.calculateAverage([]) !== 0) throw new Error('Empty array should return 0');
                    if (Utils.calculateAverage([1, 2, 3]) !== 2) throw new Error('Basic average failed');
                }
            },
            {
                name: 'Date formatting',
                test: () => {
                    const date = new Date('2025-01-01T12:00:00Z');
                    const formatted = Utils.formatDate(date.toISOString());
                    if (!formatted.includes('2025')) throw new Error('Date formatting failed');
                }
            },
            {
                name: 'HTML sanitization',
                test: () => {
                    const malicious = '<script>alert("xss")</script>';
                    const safe = Utils.sanitizeHtml(malicious);
                    if (safe.includes('<script>')) throw new Error('XSS vulnerability');
                }
            },
            {
                name: 'State management',
                test: () => {
                    if (this.state.getState('tickets').length === 0) throw new Error('No seed data');
                }
            }
        ];

        const results = tests.map(({ name, test }) => {
            try {
                test();
                return { name, pass: true };
            } catch (error) {
                return { name, pass: false, error: error.message };
            }
        });

        testResults.innerHTML = results.map(result => `
            <div class="small ${result.pass ? 'text-success' : 'text-danger'}">
                ${result.pass ? '✓' : '✗'} ${Utils.sanitizeHtml(result.name)}
                ${result.error ? ` — ${Utils.sanitizeHtml(result.error)}` : ''}
            </div>
        `).join('');
    }
}

// Global functions for inline event handlers (keeping them minimal)
window.addEvidence = function(kind, listType) {
    const app = window.complaintsApp;
    if (!app) return;

    const activeTicket = app.state.getActiveTicket();
    if (!activeTicket) return;

    // Determine field IDs based on list type
    const fieldMappings = {
        'complaint.images': { file: 'ci-file', time: 'ci-time', default: 'image.jpg' },
        'complaint.videos': { file: 'cv-file', time: 'cv-time', default: 'clip.mp4' },
        'admin.supportingImages': { file: 'si-file', time: 'si-time', default: 'support.jpg' },
        'admin.supportingVideos': { file: 'sv-file', time: 'sv-time', default: 'clip.mp4' },
        'admin.supportingDocs': { file: 'sd-file', time: null, default: 'doc.pdf' }
    };

    const mapping = fieldMappings[listType];
    if (!mapping) return;

    const fileInput = document.getElementById(mapping.file);
    const timeInput = mapping.time ? document.getElementById(mapping.time) : null;
    
    // Get filename from file input or use default
    const name = fileInput && fileInput.files.length > 0 ? fileInput.files[0].name : mapping.default;
    const takenAt = timeInput?.value ? new Date(timeInput.value).toISOString() : new Date().toISOString();

    const evidence = {
        id: Math.random().toString(36).substr(2, 8),
        kind: kind,
        name: name,
        takenAt: kind === 'doc' ? undefined : takenAt,
        file: fileInput && fileInput.files.length > 0 ? fileInput.files[0] : null
    };

    app.state.updateTicket(activeTicket.id, (ticket) => {
        if (listType === 'complaint.images') {
            ticket.complaint.images.push(evidence);
        } else if (listType === 'complaint.videos') {
            ticket.complaint.videos.push(evidence);
        } else if (listType === 'admin.supportingImages') {
            ticket.admin.supportingImages.push(evidence);
        } else if (listType === 'admin.supportingVideos') {
            ticket.admin.supportingVideos.push(evidence);
        } else if (listType === 'admin.supportingDocs') {
            ticket.admin.supportingDocs.push(evidence);
        }

        // Add audit entry
        ticket.audit.push({
            at: new Date().toISOString(),
            who: 'agent',
            action: `Added ${kind} ${name}`
        });

        return ticket;
    });

    // Clear input fields
    if (fileInput) fileInput.value = '';
    if (timeInput) timeInput.value = '';

    NotificationSystem.show(`${kind} "${name}" added successfully`, 'success');
};

window.setTicketStatus = function(status) {
    const app = window.complaintsApp;
    if (!app) return;

    const activeTicket = app.state.getActiveTicket();
    if (!activeTicket) return;

    // Validation for reject status
    if (status === 'Rejected' && !activeTicket.admin.outcome?.rejectReason) {
        NotificationSystem.show('Reject reason is required before setting status to Rejected', 'error');
        return;
    }

    app.state.updateTicket(activeTicket.id, (ticket) => {
        ticket.status = status;
        ticket.audit.push({
            at: new Date().toISOString(),
            who: 'agent',
            action: `Status changed to ${status}`
        });
        return ticket;
    });

    NotificationSystem.show(`Ticket status updated to ${status}`, 'success');
};

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    try {
        // Initialize error boundary
        ErrorBoundary.init();
        
        // Initialize main application
        window.complaintsApp = new ComplaintsDeskApp();
        
        console.log('Complaints & Claims Desk application initialized successfully');
    } catch (error) {
        console.error('Failed to initialize application:', error);
        ErrorBoundary.showError(error);
    }
});

// ===== MESSAGING BACKEND FUNCTIONALITY =====
// Additional functionality for messaging control room interface

// Messaging Backend Class
class MessagingBackend {
    constructor() {
        // Customer data
        this.customers = {
            c1: { id: "c1", name: "John Hamilton", phone: "+447700900001" },
            c2: { id: "c2", name: "Sarah Malik", phone: "+447700900002" },
            c3: { id: "c3", name: "Adam Brown", phone: "+447700900003" }
        };

        // Conversation data for each customer
        this.conversations = {
            c1: [
                { type: "received", text: "Hello, I am ready at bay B" },
                { type: "sent", text: "Thanks John, five mins please" },
                { type: "received", text: "Sure" }
            ],
            c2: [
                { type: "received", text: "Hi, where should I wait?" },
                { type: "sent", text: "Hi Sarah, please wait at Terminal 2 pickup area" },
                { type: "received", text: "Got it, thanks!" }
            ],
            c3: [
                { type: "received", text: "There's a small scratch on my car" },
                { type: "sent", text: "Please share a picture of the mark. We will arrange repair." },
                { type: "received", text: "Sending photo now" }
            ]
        };

        // Template data
        this.templates = {
            t1: {
                name: "Arrival pick up",
                channel: "whatsapp",
                body: "Hi {{name}}, welcome back. Your car is ready at bay B. Reply 1 for five mins, 2 for ten mins.",
                variables: ["name"]
            },
            t2: {
                name: "Delay notice", 
                channel: "sms",
                body: "Hi {{name}}, we are running a few mins behind due to traffic at {{terminal}}. We will update you shortly.",
                variables: ["name", "terminal"]
            },
            t3: {
                name: "Review request",
                channel: "sms", 
                body: "Thanks {{name}} for using Star Parking. Share your experience here: {{short_link}}",
                variables: ["name", "short_link"]
            }
        };

        // Variables state
        this.variables = { name: "", terminal: "", short_link: "" };

        // Calendar state
        this.currentCalendarDate = new Date();
        this.selectedDate = null;

        // DOM elements
        this.templateSelect = null;
        this.templateVariables = null;
        this.plainTextArea = null;
        this.previewText = null;
        this.previewLength = null;
        this.clearTemplateBtn = null;
        this.scheduleSwitch = null;
        this.scheduleCalendar = null;
        this.abTestSwitch = null;
        this.defineVariants = null;
    }

    init() {
        // Only initialize if we're on the messaging page
        if (!document.getElementById('templateSelect')) {
            return;
        }

        this.initializeDOMElements();
        this.initializeEventListeners();
        this.initializeCalendar();
        this.updateTemplate('t1');
    }

    initializeDOMElements() {
        this.templateSelect = document.getElementById('templateSelect');
        this.templateVariables = document.getElementById('templateVariables');
        this.plainTextArea = document.getElementById('plainTextArea');
        this.previewText = document.getElementById('previewText');
        this.previewLength = document.getElementById('previewLength');
        this.clearTemplateBtn = document.getElementById('clearTemplate');
        this.scheduleSwitch = document.getElementById('scheduleSwitch');
        this.scheduleCalendar = document.getElementById('scheduleCalendar');
        this.abTestSwitch = document.getElementById('abTestSwitch');
        this.defineVariants = document.getElementById('defineVariants');
    }

    initializeEventListeners() {
        // Customer selection - scope to messaging backend only
        document.querySelectorAll('#messaging-backend .customer-item').forEach(item => {
            item.addEventListener('click', (e) => {
                document.querySelectorAll('#messaging-backend .customer-item').forEach(c => c.classList.remove('selected'));
                item.classList.add('selected');
                
                // Update live thread with selected customer
                const customerId = item.dataset.customer;
                this.updateLiveThread(customerId);
            });
        });

        // Template selection
        if (this.templateSelect) {
            this.templateSelect.addEventListener('change', (e) => {
                const templateId = e.target.value;
                this.updateTemplate(templateId);
            });
        }

        // Clear template
        if (this.clearTemplateBtn) {
            this.clearTemplateBtn.addEventListener('click', () => {
                this.templateSelect.value = '';
                this.updateTemplate('');
            });
        }

        // Schedule switch
        if (this.scheduleSwitch) {
            this.scheduleSwitch.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.scheduleCalendar.classList.remove('d-none');
                } else {
                    this.scheduleCalendar.classList.add('d-none');
                }
            });
        }

        // A/B Test switch
        if (this.abTestSwitch) {
            this.abTestSwitch.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.defineVariants.classList.remove('d-none');
                } else {
                    this.defineVariants.classList.add('d-none');
                }
            });
        }

        // Plain text input
        const plainTextInput = document.getElementById('plainText');
        if (plainTextInput) {
            plainTextInput.addEventListener('input', () => this.updatePreview());
        }

        // Search functionality - scope to messaging backend only
        const searchInput = document.getElementById('searchInput');
        if (searchInput && document.getElementById('messaging-backend')) {
            searchInput.addEventListener('input', (e) => {
                const query = e.target.value.toLowerCase();
                document.querySelectorAll('#messaging-backend .customer-item').forEach(item => {
                    const name = item.querySelector('.fw-medium').textContent.toLowerCase();
                    const phone = item.querySelector('.text-muted').textContent.toLowerCase();
                    
                    if (name.includes(query) || phone.includes(query.replace(/\s/g, ''))) {
                        item.style.display = 'block';
                    } else {
                        item.style.display = 'none';
                    }
                });
            });
        }
    }

    updateTemplate(templateId) {
        if (templateId && this.templates[templateId]) {
            const template = this.templates[templateId];
            
            // Show template variables, hide plain text
            this.templateVariables.classList.remove('d-none');
            this.plainTextArea.classList.add('d-none');
            
            // Update variables inputs
            const variablesHtml = template.variables.map(variable => `
                <div class="col-4">
                    <div class="text-xs text-muted">${variable}</div>
                    <input type="text" class="form-control variable-input" 
                           placeholder="Value for ${variable}" 
                           data-variable="${variable}"
                           value="${this.variables[variable] || ''}">
                </div>
            `).join('');
            
            const variablesRow = this.templateVariables.querySelector('.row');
            if (variablesRow) {
                variablesRow.innerHTML = variablesHtml;
            }
            
            // Add event listeners to variable inputs
            document.querySelectorAll('.variable-input').forEach(input => {
                input.addEventListener('input', (e) => {
                    this.variables[e.target.dataset.variable] = e.target.value;
                    this.updatePreview();
                });
            });
            
            this.updatePreview();
        } else {
            // Show plain text, hide template variables
            this.templateVariables.classList.add('d-none');
            this.plainTextArea.classList.remove('d-none');
            this.updatePreview();
        }
    }

    updatePreview() {
        const templateId = this.templateSelect ? this.templateSelect.value : '';
        let text = '';
        
        if (templateId && this.templates[templateId]) {
            text = this.templates[templateId].body;
            // Replace variables
            Object.entries(this.variables).forEach(([key, value]) => {
                text = text.replaceAll(`{{${key}}}`, value || `{{${key}}}`);
            });
        } else {
            const plainTextInput = document.getElementById('plainText');
            text = plainTextInput ? plainTextInput.value || 'Your text will appear here' : 'Your text will appear here';
        }
        
        if (this.previewText) {
            this.previewText.textContent = text;
        }
        if (this.previewLength) {
            this.previewLength.textContent = text.length;
        }
    }

    initializeCalendar() {
        this.renderCalendar();
        
        // Month navigation
        const prevBtn = document.getElementById('prevMonth');
        const nextBtn = document.getElementById('nextMonth');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() - 1);
                this.renderCalendar();
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.currentCalendarDate.setMonth(this.currentCalendarDate.getMonth() + 1);
                this.renderCalendar();
            });
        }
    }

    renderCalendar() {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'];
        
        const currentMonth = this.currentCalendarDate.getMonth();
        const currentYear = this.currentCalendarDate.getFullYear();
        
        // Update month display
        const currentMonthElement = document.getElementById('currentMonth');
        if (currentMonthElement) {
            currentMonthElement.textContent = `${monthNames[currentMonth]} ${currentYear}`;
        }
        
        // Get first day of month and number of days
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        
        // Get today's date for highlighting
        const today = new Date();
        const isCurrentMonth = today.getFullYear() === currentYear && today.getMonth() === currentMonth;
        
        const calendarDates = document.getElementById('calendarDates');
        if (!calendarDates) return;
        
        calendarDates.innerHTML = '';
        
        // Add empty cells for days before the month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            const prevMonthDay = new Date(currentYear, currentMonth, 0 - (startingDayOfWeek - 1 - i));
            const dayElement = this.createDateElement(prevMonthDay.getDate(), 'other-month');
            calendarDates.appendChild(dayElement);
        }
        
        // Add days of the current month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayElement = this.createDateElement(day);
            
            // Highlight today
            if (isCurrentMonth && day === today.getDate()) {
                dayElement.classList.add('today');
            }
            
            // Add click event
            dayElement.addEventListener('click', () => {
                // Remove previous selection
                document.querySelectorAll('.calendar-date.selected').forEach(el => {
                    el.classList.remove('selected');
                });
                
                // Select this date
                dayElement.classList.add('selected');
                this.selectedDate = new Date(currentYear, currentMonth, day);
            });
            
            calendarDates.appendChild(dayElement);
        }
        
        // Fill remaining cells to complete exactly 6 weeks (42 days)
        const totalCells = calendarDates.children.length;
        const remainingCells = 42 - totalCells;
        for (let i = 1; i <= remainingCells; i++) {
            const nextMonthDay = this.createDateElement(i, 'other-month');
            calendarDates.appendChild(nextMonthDay);
        }
    }

    createDateElement(day, className = '') {
        const dayElement = document.createElement('div');
        dayElement.className = `calendar-date ${className}`;
        dayElement.textContent = day;
        return dayElement;
    }

    updateLiveThread(customerId) {
        const customer = this.customers[customerId];
        const conversation = this.conversations[customerId];
        
        if (!customer || !conversation) return;
        
        // Update the customer badge in live thread header
        const customerBadge = document.querySelector('#messaging-backend .card-body h6 + .badge');
        if (customerBadge) {
            customerBadge.textContent = customer.name;
        }
        
        // Update the conversation messages
        const liveThread = document.getElementById('liveThread');
        if (!liveThread) return;
        
        liveThread.innerHTML = '';
        
        conversation.forEach(message => {
            const messageDiv = document.createElement('div');
            messageDiv.className = `d-flex justify-content-${message.type === 'sent' ? 'end' : 'start'} mb-2`;
            
            const bubbleDiv = document.createElement('div');
            bubbleDiv.className = `message-bubble-${message.type} p-2`;
            
            const textDiv = document.createElement('div');
            textDiv.className = 'text-sm';
            textDiv.textContent = message.text;
            
            bubbleDiv.appendChild(textDiv);
            messageDiv.appendChild(bubbleDiv);
            liveThread.appendChild(messageDiv);
        });
    }
}

// Initialize messaging backend when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize messaging backend if we're on the messaging page
    if (document.getElementById('templateSelect')) {
        window.messagingBackend = new MessagingBackend();
        window.messagingBackend.init();
        console.log('Messaging Backend initialized successfully');
    }
    
    // Initialize plate scanner if we're on the plate scanner page
    if (document.getElementById('plate-scanner')) {
        window.plateScanner = new PlateScanner();
        window.plateScanner.init();
        console.log('Plate Scanner initialized successfully');
    }
});

// ===== PLATE SCANNER FUNCTIONALITY =====
// Plate scanner with OCR and booking lookup functionality

class PlateScanner {
    constructor() {
        // DOM elements
        this.video = null;
        this.frame = null;
        this.startBtn = null;
        this.stopBtn = null;
        this.cameraSelect = null;
        this.autoCapture = null;
        this.intervalEl = null;
        this.confidenceEl = null;
        this.lastPlateEl = null;
        this.manualPlate = null;
        this.lookupBtn = null;
        this.logEl = null;
        this.bookingBox = null;
        this.envWarn = null;
        this.envWarnText = null;
        this.permState = null;
        this.fileInput = null;
        this.testOutput = null;
        this.mockToggle = null;

        // State
        this.stream = null;
        this.timer = null;
        this.worker = null;

        // UK plate regex patterns
        this.UK_REGEXES = [
            /\b([A-Z]{2}\d{2}\s?[A-Z]{3})\b/g,              // current format
            /\b([A-Z]{1,3}\d{1,4}\s?[A-Z]{1,3})\b/g,         // cherished formats
        ];
    }

    init() {
        // Only initialize if we're on the plate scanner page
        if (!document.getElementById('plate-scanner')) {
            return;
        }

        this.initializeDOMElements();
        this.initializeEventListeners();
        this.showEnvWarnings();
        this.updatePermissionState();
        this.runTests();
    }

    initializeDOMElements() {
        this.video = document.getElementById('video');
        this.frame = document.getElementById('frame');
        this.startBtn = document.getElementById('startBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.cameraSelect = document.getElementById('cameraSelect');
        this.autoCapture = document.getElementById('autoCapture');
        this.intervalEl = document.getElementById('interval');
        this.confidenceEl = document.getElementById('confidence');
        this.lastPlateEl = document.getElementById('lastPlate');
        this.manualPlate = document.getElementById('manualPlate');
        this.lookupBtn = document.getElementById('lookupBtn');
        this.logEl = document.getElementById('log');
        this.bookingBox = document.getElementById('bookingBox');
        this.envWarn = document.getElementById('envWarn');
        this.envWarnText = document.getElementById('envWarnText');
        this.permState = document.getElementById('permState');
        this.fileInput = document.getElementById('fileInput');
        this.testOutput = document.getElementById('testOutput');
        this.mockToggle = document.getElementById('mockToggle');
    }

    initializeEventListeners() {
        // Camera controls
        if (this.startBtn) {
            this.startBtn.addEventListener('click', () => this.startCamera());
        }

        if (this.stopBtn) {
            this.stopBtn.addEventListener('click', () => this.stopCamera());
        }

        if (this.cameraSelect) {
            this.cameraSelect.addEventListener('change', () => {
                if (this.stream) {
                    this.stopCamera();
                    this.startCamera();
                }
            });
        }

        if (this.intervalEl) {
            this.intervalEl.addEventListener('change', () => {
                if (this.timer) {
                    this.scheduleScan();
                }
            });
        }

        if (this.autoCapture) {
            this.autoCapture.addEventListener('change', () => {
                if (this.autoCapture.checked) {
                    this.scheduleScan();
                } else if (this.timer) {
                    clearTimeout(this.timer);
                    this.timer = null;
                }
            });
        }

        // Manual lookup
        if (this.lookupBtn) {
            this.lookupBtn.addEventListener('click', () => {
                const val = this.manualPlate.value.trim().toUpperCase().replace(/\s/g, '');
                if (!val) return;
                this.lastPlateEl.textContent = val.replace(/(.{2})(.{2})(.{3})/, '$1$2 $3');
                this.lookupByReg(val);
            });
        }

        // File upload
        if (this.fileInput) {
            this.fileInput.addEventListener('change', async (e) => {
                const file = e.target.files && e.target.files[0];
                if (!file) return;
                try {
                    const bmp = await createImageBitmap(file);
                    const data = await this.doOCRFromImageBitmap(bmp);
                    this.handleOCRResult(data);
                } catch (error) {
                    this.log('Error processing uploaded image: ' + error.message);
                }
            });
        }
    }

    normalisePlate(text) {
        if (!text) return null;
        let t = text.toUpperCase()
            .replace(/\n/g, ' ')
            .replace(/[^A-Z0-9 ]/g, '')
            .replace(/O/g, '0');
        
        for (const re of this.UK_REGEXES) {
            const matches = [...t.matchAll(re)].map(m => m[1].replace(/\s/g, ''));
            if (matches.length) {
                const best = matches.sort((a, b) => Math.abs(7 - a.length) - Math.abs(7 - b.length))[0];
                return best;
            }
        }
        return null;
    }

    log(msg) {
        if (!this.logEl) return;
        const div = document.createElement('div');
        div.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
        this.logEl.prepend(div);
    }

    showEnvWarnings() {
        if (!this.envWarn || !this.envWarnText) return;
        
        const issues = [];
        if (!window.isSecureContext) {
            issues.push('This page is not on HTTPS or localhost. Browsers block camera on insecure origins.');
        }
        if (!('mediaDevices' in navigator)) {
            issues.push('This browser does not support media devices.');
        }
        if (document.visibilityState !== 'visible') {
            issues.push('Tab is not active.');
        }
        
        if (issues.length) {
            this.envWarn.classList.remove('d-none');
            this.envWarnText.innerHTML = issues.map(i => `• ${i}`).join('<br>');
            this.log('Environment warning: ' + issues.join(' | '));
        } else {
            this.envWarn.classList.add('d-none');
        }
    }

    async updatePermissionState() {
        if (!this.permState) return;
        
        try {
            if (!navigator.permissions) {
                this.permState.textContent = 'permission api n/a';
                return;
            }
            
            const permission = await navigator.permissions.query({ name: 'camera' });
            const updateState = () => {
                this.permState.textContent = 'camera ' + permission.state;
                this.permState.className = 'badge ' + (
                    permission.state === 'granted' ? 'permission-granted' : 
                    permission.state === 'denied' ? 'permission-denied' : 
                    'permission-prompt'
                );
            };
            
            permission.addEventListener('change', updateState);
            updateState();
        } catch (error) {
            this.permState.textContent = 'permission unknown';
            this.permState.className = 'badge bg-secondary';
        }
    }

    async listCameras() {
        if (!navigator.mediaDevices) return;
        
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(d => d.kind === 'videoinput');
            
            this.cameraSelect.innerHTML = '';
            videoDevices.forEach((device, index) => {
                const option = document.createElement('option');
                option.value = device.deviceId;
                option.textContent = device.label || `Camera ${index + 1}`;
                this.cameraSelect.appendChild(option);
            });
        } catch (error) {
            this.log('Error listing cameras: ' + error.message);
        }
    }

    async startCamera() {
        this.showEnvWarnings();
        await this.updatePermissionState();
        
        if (!window.isSecureContext) {
            alert('Browser policy: camera only works on HTTPS or localhost. Use your https domain or run on localhost.');
            return;
        }
        
        if (!('mediaDevices' in navigator)) {
            alert('Camera not supported in this browser');
            return;
        }
        
        try {
            await this.listCameras();
            
            const deviceId = this.cameraSelect.value || undefined;
            const constraints = {
                video: deviceId ? 
                    { deviceId: { exact: deviceId } } : 
                    { facingMode: { ideal: 'environment' }, resizeMode: 'crop-and-scale' },
                audio: false
            };
            
            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            this.video.srcObject = this.stream;
            await this.video.play();
            
            this.startBtn.disabled = true;
            this.stopBtn.disabled = false;
            this.log('Camera started');
            
            // Initialize OCR worker if not already done
            if (!this.worker) {
                this.worker = await Tesseract.createWorker({
                    logger: m => {
                        if (m.status === 'recognizing text') {
                            // Keep quiet during recognition
                        }
                    }
                });
                await this.worker.loadLanguage('eng');
                await this.worker.initialize('eng');
                this.log('OCR ready');
            }
            
            if (this.autoCapture.checked) {
                this.scheduleScan();
            }
        } catch (error) {
            console.error(error);
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                this.log('Camera permission denied. Use Upload fallback or allow access in browser settings.');
                alert('Camera permission denied by the browser. Use the Upload option or enable camera access in site settings.');
            } else if (error.name === 'NotFoundError') {
                this.log('No camera device found.');
                alert('No camera device found. Use Upload fallback.');
            } else {
                this.log('Camera failed: ' + (error.message || error));
                alert('Camera failed: ' + (error.message || error));
            }
        }
    }

    stopCamera() {
        if (this.timer) {
            clearTimeout(this.timer);
            this.timer = null;
        }
        
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        this.startBtn.disabled = false;
        this.stopBtn.disabled = true;
        this.log('Camera stopped');
    }

    scheduleScan() {
        if (this.timer) clearTimeout(this.timer);
        const interval = Math.max(300, Number(this.intervalEl.value) || 1500);
        this.timer = setTimeout(() => this.captureAndRead(), interval);
    }

    async doOCRFromImageBitmap(bitmap) {
        if (!this.worker) {
            this.worker = await Tesseract.createWorker();
            await this.worker.loadLanguage('eng');
            await this.worker.initialize('eng');
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        canvas.getContext('2d').drawImage(bitmap, 0, 0);
        
        const { data } = await this.worker.recognize(canvas);
        return data;
    }

    async captureAndRead() {
        if (!this.stream || !this.worker || !this.video) return;
        
        const width = 640;
        const ratio = this.video.videoHeight ? (this.video.videoWidth / this.video.videoHeight) : (16 / 9);
        const height = Math.round(width / ratio);
        
        this.frame.width = width;
        this.frame.height = height;
        
        const ctx = this.frame.getContext('2d');
        ctx.drawImage(this.video, 0, 0, width, height);
        
        try {
            const { data } = await this.worker.recognize(this.frame);
            this.handleOCRResult(data);
        } catch (error) {
            console.error(error);
            this.log('OCR error');
        } finally {
            if (this.autoCapture.checked) {
                this.scheduleScan();
            }
        }
    }

    handleOCRResult(data) {
        const plate = this.normalisePlate(data.text);
        if (plate) {
            this.lastPlateEl.textContent = plate.replace(/(.{2})(.{2})(.{3})/, '$1$2 $3');
            const confidence = Math.round(data.confidence || 55);
            this.log(`Detected ${plate} conf ${confidence}`);
            
            const threshold = Number(this.confidenceEl.value) || 45;
            if (confidence >= threshold) {
                this.lookupByReg(plate);
            }
        } else {
            this.log('No plate matched');
        }
    }

    async lookupByReg(reg) {
        try {
            const url = `/api/bookings?reg=${encodeURIComponent(reg)}`;
            const response = this.mockToggle.checked ? await this.mockFetch(url) : await fetch(url);
            
            if (!response.ok) {
                throw new Error('No match');
            }
            
            const data = await response.json();
            this.renderBooking(data);
        } catch (error) {
            this.bookingBox.innerHTML = `
                <div class="text-center py-4 booking-warning">
                    <i class="bi bi-exclamation-triangle fs-1 text-warning d-block mb-2"></i>
                    <div class="fw-medium">No booking found</div>
                    <div class="text-muted">for plate <span class="badge bg-warning text-dark">${reg}</span></div>
                </div>
            `;
        }
    }

    renderBooking(booking) {
        const arrivalDate = booking.arrival ? new Date(booking.arrival) : null;
        
        this.bookingBox.innerHTML = `
            <div class="booking-success p-3 rounded">
                <div class="d-flex justify-content-between align-items-center mb-3">
                    <div class="plate-display">${booking.reg || ''}</div>
                    <span class="badge bg-success">${booking.status || 'unknown'}</span>
                </div>
                
                <div class="row g-3">
                    <div class="col-6">
                        <div class="fw-medium text-success">Customer</div>
                        <div>${booking.customer || ''}</div>
                    </div>
                    <div class="col-6">
                        <div class="fw-medium text-success">Booking ID</div>
                        <div><code>${booking.bookingId || ''}</code></div>
                    </div>
                    <div class="col-6">
                        <div class="fw-medium text-success">Product</div>
                        <div>${booking.product || ''}</div>
                    </div>
                    <div class="col-6">
                        <div class="fw-medium text-success">Terminal</div>
                        <div>${booking.terminal || ''}</div>
                    </div>
                    <div class="col-6">
                        <div class="fw-medium text-success">Arrival</div>
                        <div>${arrivalDate ? arrivalDate.toLocaleString() : ''}</div>
                    </div>
                    <div class="col-6">
                        <div class="fw-medium text-success">Phone</div>
                        <div>${booking.phone || ''}</div>
                    </div>
                </div>
            </div>
        `;
    }

    // Mock API for testing without backend
    async mockFetch(url) {
        const urlObj = new URL(url, location.origin);
        const reg = (urlObj.searchParams.get('reg') || '').toUpperCase();
        const validRegs = ['AB12CDE', 'REZ123', 'STAR001', 'GF12ABC'];
        const found = validRegs.includes(reg);
        
        return new Response(
            found ? JSON.stringify({
                reg,
                status: 'due in',
                customer: 'Test User',
                product: 'Meet and Greet',
                terminal: 'T3',
                arrival: new Date(Date.now() + 3600000).toISOString(),
                phone: '+44 7700 900123',
                bookingId: 'SP-TEST'
            }) : 'not found',
            {
                status: found ? 200 : 404,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }

    // Self tests for normalisePlate function
    runTests() {
        if (!this.testOutput) return;
        
        const testCases = [
            ['AB12 CDE', 'AB12CDE'],
            ['ab12cde', 'AB12CDE'],
            ['0O12 CDE', '0012CDE'], // O to 0
            ['A1 REZ', 'A1REZ'],
            ['STAR 1', 'STAR1'],
            ['bad text no plate', null],
            ['GF12 ABC parked', 'GF12ABC'],
        ];
        
        let passed = 0;
        let failed = 0;
        const results = [];
        
        for (const [input, expected] of testCases) {
            const result = this.normalisePlate(input);
            if (result === expected) {
                passed++;
                results.push(`PASS ${input} -> ${result}`);
            } else {
                failed++;
                results.push(`FAIL ${input} -> ${result} expected ${expected}`);
            }
        }
        
        this.testOutput.textContent = results.join('\n') + `\nSummary: ${passed} passed, ${failed} failed`;
    }
}