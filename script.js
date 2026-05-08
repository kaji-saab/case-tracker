// USCIS Case Tracker - Refined Version

let cases = [];
let currentCaseNumber = '';

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    loadCasesFromStorage();
    renderCasesList();
});

// Load cases from localStorage
function loadCasesFromStorage() {
    const storedCases = localStorage.getItem('uscisRefinedCases');
    if (storedCases) {
        cases = JSON.parse(storedCases);
    }
}

// Save cases to localStorage
function saveCasesToStorage() {
    localStorage.setItem('uscisRefinedCases', JSON.stringify(cases));
}

// Generate API links
function generateLinks() {
    const caseNumber = document.getElementById('caseNumber').value.trim();
    if (!caseNumber) {
        showNotification('Please enter a case number', 'error');
        return;
    }
    
    currentCaseNumber = caseNumber;
    
    // Generate API links
    const eventsLink = `https://my.uscis.gov/account/case-service/api/cases/${caseNumber}`;
    const statusLink = `https://my.uscis.gov/account/case-service/api/case_status/${caseNumber}`;
    const locationLink = `https://my.uscis.gov/secure-messaging/api/case-service/receipt_info/${caseNumber}`;
    const documentsLink = `https://my.uscis.gov/account/case-service/api/cases/${caseNumber}/documents`;
    const processingTimeLink = `https://my.uscis.gov/account/case-service/api/cases/I-765/processing_times/${caseNumber}`;
    
    // Update links
    document.getElementById('eventsLink').href = eventsLink;
    document.getElementById('statusLink').href = statusLink;
    document.getElementById('locationLink').href = locationLink;
    document.getElementById('documentsLink').href = documentsLink;
    document.getElementById('processingTimeLink').href = processingTimeLink;
    
    // Show API links section
    document.getElementById('apiLinksSection').classList.remove('hidden');
    document.getElementById('jsonInputSection').classList.remove('hidden');
    
    showNotification('API links generated! Please click on each link, copy the JSON response, and paste it into the corresponding input field below.', 'success');
    
    // Prevent default behavior
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    
    return false;
}

// Copy receipt number to clipboard
function copyReceiptNumber(receiptNumber) {
    // Prevent ALL default behavior and stop propagation
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    
    // Try modern clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(receiptNumber).then(() => {
            showNotification('Receipt number copied to clipboard!', 'success');
        }).catch(err => {
            console.error('Failed to copy:', err);
            showNotification('Failed to copy receipt number', 'error');
        });
    } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = receiptNumber;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            showNotification('Receipt number copied to clipboard!', 'success');
        } catch (err) {
            console.error('Failed to copy:', err);
            showNotification('Failed to copy receipt number', 'error');
        }
        document.body.removeChild(textArea);
    }
    
    // Return false to prevent any default action
    return false;
}

// Process JSON data
function processJsonData() {
    const eventsJson = document.getElementById('eventsJson').value.trim();
    const statusJson = document.getElementById('statusJson').value.trim();
    
    if (!eventsJson && !statusJson) {
        showNotification('Please paste at least one JSON response', 'error');
        return;
    }
    
    try {
        let eventsData = null;
        let statusData = null;
        let receiptNumber = null;
        
        // Parse events JSON if provided
        if (eventsJson) {
            try {
                eventsData = JSON.parse(eventsJson);
                receiptNumber = eventsData.data?.receiptNumber;
            } catch (e) {
                showNotification('Invalid Events JSON format', 'error');
                return;
            }
        }
        
        // Parse status JSON if provided
        if (statusJson) {
            try {
                statusData = JSON.parse(statusJson);
                if (!receiptNumber) {
                    receiptNumber = statusData.data?.receiptNumber;
                }
            } catch (e) {
                showNotification('Invalid Status JSON format', 'error');
                return;
            }
        }
        
        // Use currentCaseNumber if no receiptNumber found in JSON
        if (!receiptNumber) {
            receiptNumber = currentCaseNumber;
        }
        
        if (!receiptNumber) {
            showNotification('No receipt number found in JSON or input', 'error');
            return;
        }
        
        // Check if case already exists
        const existingCase = cases.find(c => c.receiptNumber === receiptNumber);
        if (existingCase) {
            // Update existing case
            if (eventsData && eventsData.data) {
                Object.assign(existingCase, eventsData.data);
            }
            if (statusData && statusData.data) {
                existingCase.statusData = statusData.data;
            }
            existingCase.lastUpdated = new Date().toISOString();
            showNotification('Case updated successfully!', 'success');
        } else {
            // Add new case - events JSON is required
            if (!eventsData || !eventsData.data) {
                showNotification('Events JSON is required for new cases', 'error');
                return;
            }
            
            const newCase = {
                ...eventsData.data,
                statusData: statusData ? statusData.data : null,
                expanded: false,
                addedAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString()
            };
            cases.push(newCase);
            showNotification('Case added successfully!', 'success');
        }
        
        // Save to storage
        saveCasesToStorage();
        
        // Update UI
        renderCasesList();
        
        // Clear form
        clearForm();
        
    } catch (error) {
        console.error('Error processing JSON:', error);
        showNotification('Error processing JSON data', 'error');
    }
}

// Clear form
function clearForm() {
    document.getElementById('caseNumber').value = '';
    document.getElementById('eventsJson').value = '';
    document.getElementById('statusJson').value = '';
    document.getElementById('apiLinksSection').classList.add('hidden');
    document.getElementById('jsonInputSection').classList.add('hidden');
    currentCaseNumber = '';
}

// Render cases list
function renderCasesList() {
    const casesList = document.getElementById('casesList');
    const noCasesMessage = document.getElementById('noCasesMessage');
    const caseCount = document.getElementById('caseCount');
    
    caseCount.textContent = `${cases.length} case${cases.length !== 1 ? 's' : ''}`;
    
    if (cases.length === 0) {
        casesList.innerHTML = '';
        noCasesMessage.style.display = 'block';
        return;
    }
    
    noCasesMessage.style.display = 'none';
    
    casesList.innerHTML = cases.map(caseData => `
        <div class="border border-gray-200 rounded-lg overflow-hidden fade-in professional-card">
            <div class="p-2 sm:p-4 bg-gradient-to-r from-gray-50 to-white hover:from-gray-100 hover:to-gray-50 cursor-pointer transition-all duration-200"
                 onclick="toggleCaseDetails('${caseData.receiptNumber}')">
                <!-- Mobile: 2-line layout, Desktop: Normal layout -->
                <div class="flex flex-wrap items-center gap-3">
                    <!-- Left side: Icon + Receipt + Status + Badges -->
                    <div class="flex items-center gap-2 min-w-0 flex-1">
                        <div class="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded flex items-center justify-center flex-shrink-0" style="width: 1rem; height: 1rem;">
                            <i class="fas fa-file-alt text-white" style="font-size: 0.45rem;"></i>
                        </div>
                        <div class="min-w-0 flex-1">
                            <div class="flex items-center gap-2">
                                <h3 class="font-semibold text-gray-800 truncate" style="font-size: 0.75rem; line-height: 1.2;">${caseData.receiptNumber}</h3>
                                <span class="status-badge ${getStatusClass(caseData.statusData?.currentActioCode || caseData.statusData?.currentActionCode)}" style="font-size: 0.6rem; padding: 0.125rem 0.25rem; max-width: 3rem;">
                                    ${caseData.statusData?.currentActioCode || caseData.statusData?.currentActionCode || 'UNKNOWN'}
                                </span>
                            </div>
                            <div class="flex flex-wrap items-center gap-1">
                                <span class="bg-blue-100 text-blue-700 rounded" style="font-size: 0.7rem; padding: 0.125rem 0.375rem;">${caseData.formType}</span>
                                ${caseData.applicantName ? `<span class="bg-gray-100 text-gray-700 rounded truncate max-w-40 sm:max-w-48" style="font-size: 0.7rem; padding: 0.125rem 0.375rem;">${caseData.applicantName}</span>` : ''}
                            </div>
                        </div>
                    </div>
                    
                    <!-- Actions -->
                    <div class="flex items-center gap-2 flex-shrink-0">
                        <button onclick="event.stopPropagation(); copyReceiptNumber('${caseData.receiptNumber}')" 
                                class="bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                style="padding: 0.375rem 0.75rem; font-size: 0.75rem; min-width: 3rem;"
                                title="Copy Receipt Number">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button onclick="event.stopPropagation(); deleteCase('${caseData.receiptNumber}')" 
                                class="bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                                style="padding: 0.375rem 0.75rem; font-size: 0.75rem; min-width: 3rem;"
                                title="Delete Case">
                            <i class="fas fa-trash"></i>
                        </button>
                        <i class="fas fa-chevron-${caseData.expanded ? 'up' : 'down'} text-gray-400" style="font-size: 0.875rem;"></i>
                    </div>
                </div>
            </div>
            
            <div id="details-${caseData.receiptNumber}" class="${caseData.expanded ? 'block' : 'hidden'} border-t border-gray-200">
                <!-- Case Details -->
                <div class="p-4 bg-white">
                    <h4 class="font-semibold text-gray-800 mb-3 text-sm flex items-center">
                        <i class="fas fa-info-circle text-blue-600 mr-2"></i>Case Details
                    </h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div>
                            <label class="text-xs font-medium text-gray-500">Receipt Number</label>
                            <p class="font-semibold text-gray-800">${caseData.receiptNumber}</p>
                        </div>
                        <div>
                            <label class="text-xs font-medium text-gray-500">Form Type</label>
                            <p class="font-semibold text-gray-800">${caseData.formType} - ${caseData.formName}</p>
                        </div>
                        <div>
                            <label class="text-xs font-medium text-gray-500">Applicant Name</label>
                            <p class="font-semibold text-gray-800">${caseData.applicantName}</p>
                        </div>
                        <div>
                            <label class="text-xs font-medium text-gray-500">Submission Date</label>
                            <p class="font-semibold text-gray-800">${formatDate(caseData.submissionDate)}</p>
                        </div>
                        <div>
                            <label class="text-xs font-medium text-gray-500">Last Updated</label>
                            <p class="font-semibold text-gray-800">${formatDate(caseData.updatedAt)}</p>
                        </div>
                        <div>
                            <label class="text-xs font-medium text-gray-500">Added On</label>
                            <p class="font-semibold text-gray-800">${formatDate(caseData.addedAt)}</p>
                        </div>
                    </div>
                </div>
                
                <!-- Case Status -->
                ${caseData.statusData ? `
                    <div class="p-4 bg-gray-50 border-t border-gray-200">
                        <h4 class="font-semibold text-gray-800 mb-3 text-sm flex items-center">
                            <i class="fas fa-chart-line text-blue-600 mr-2"></i>Current Status
                        </h4>
                        <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <h5 class="font-semibold text-blue-800 mb-2 text-sm">${caseData.statusData.statusTitle || 'Status Unknown'}</h5>
                            <p class="text-blue-700 text-sm">${caseData.statusData.statusText || 'No status information available'}</p>
                        </div>
                        <div class="grid grid-cols-2 gap-4 mt-3 text-xs">
                            <div>
                                <label class="text-xs font-medium text-gray-500">Action Code</label>
                                <p class="font-semibold text-gray-800">${caseData.statusData.currentActioCode || caseData.statusData.currentActionCode || 'N/A'}</p>
                            </div>
                            <div>
                                <label class="text-xs font-medium text-gray-500">Action Code Date</label>
                                <p class="font-semibold text-gray-800">${caseData.statusData.currentActionCodeDate || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                ` : ''}
                
                <!-- Events Timeline -->
                ${caseData.events && caseData.events.length > 0 ? `
                    <div class="p-2 sm:p-4 bg-white border-t border-gray-200 timeline-mobile-compact">
                        <h4 class="font-semibold text-gray-800 mb-2 sm:mb-3 text-sm flex items-center">
                            <div class="w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 rounded-lg flex items-center justify-center mr-2">
                                <i class="fas fa-history text-blue-600 text-xs"></i>
                            </div>
                            Events Timeline
                        </h4>
                        <div class="relative pl-4 sm:pl-6 space-y-2 sm:space-y-3 timeline-mobile-spacing">
                            ${caseData.events.map((event, index) => `
                                <div class="relative ${index === caseData.events.length - 1 ? '' : 'pb-2 sm:pb-3'}">
                                    ${index !== caseData.events.length - 1 ? '<div class="absolute left-0 top-5 sm:top-6 bottom-0 w-0.5 timeline-connector"></div>' : ''}
                                    <div class="absolute left-0 top-0.5 sm:top-1 w-2.5 h-2.5 sm:w-3 sm:h-3 timeline-node rounded-full"></div>
                                    <div class="ml-3 sm:ml-4">
                                        <div class="bg-gray-50 rounded-lg p-2 sm:p-3 border border-gray-100 timeline-mobile-inner">
                                            <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-2 sm:gap-3">
                                                <div class="flex-1 min-w-0">
                                                    <div class="flex items-center mb-1 sm:mb-2">
                                                        <label class="text-xs font-medium text-gray-500 mr-2">Event Code:</label>
                                                        <h5 class="font-semibold text-gray-800 text-sm">${event.eventCode}</h5>
                                                    </div>
                                                    <div class="text-xs text-gray-600" style="display: block; margin-bottom: 0.5rem;">
                                                        <div style="display: block; margin-bottom: 0.5rem;">
                                                            <i class="fas fa-calendar text-blue-500" style="margin-right: 0.25rem;"></i>
                                                            <span>Event: ${event.eventDateTime}</span>
                                                        </div>
                                                        <div style="display: block; margin-bottom: 0.5rem;">
                                                            <i class="fas fa-clock text-green-500" style="margin-right: 0.25rem;"></i>
                                                            <span>Timestamp: ${event.eventTimestamp}</span>
                                                        </div>
                                                        <div style="display: block; margin-bottom: 0.5rem;">
                                                            <i class="fas fa-calendar-plus text-purple-500" style="margin-right: 0.25rem;"></i>
                                                            <span>Created: ${event.createdAt}</span>
                                                        </div>
                                                        <div style="display: block; margin-bottom: 0.5rem;">
                                                            <i class="fas fa-clock text-purple-500" style="margin-right: 0.25rem;"></i>
                                                            <span>Created TS: ${event.createdAtTimestamp}</span>
                                                        </div>
                                                        <div style="display: block; margin-bottom: 0.5rem;">
                                                            <i class="fas fa-calendar-check text-orange-500" style="margin-right: 0.25rem;"></i>
                                                            <span>Updated: ${event.updatedAt}</span>
                                                        </div>
                                                        <div style="display: block;">
                                                            <i class="fas fa-clock text-orange-500" style="margin-right: 0.25rem;"></i>
                                                            <span>Updated TS: ${event.updatedAtTimestamp}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="text-right ml-2 sm:ml-4 flex-shrink-0">
                                                    <p class="text-xs text-gray-500 mb-1">Event ID</p>
                                                    <p class="text-xs font-mono bg-gray-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded border border-gray-200">${event.eventId.substring(0, 8)}...</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        </div>
    `).join('');
}

// Toggle case details
function toggleCaseDetails(receiptNumber) {
    const caseData = cases.find(c => c.receiptNumber === receiptNumber);
    if (caseData) {
        caseData.expanded = !caseData.expanded;
        const detailsDiv = document.getElementById(`details-${receiptNumber}`);
        if (caseData.expanded) {
            detailsDiv.classList.remove('hidden');
            detailsDiv.classList.add('block');
        } else {
            detailsDiv.classList.remove('block');
            detailsDiv.classList.add('hidden');
        }
        renderCasesList();
    }
}

// Delete case
function deleteCase(receiptNumber) {
    const caseData = cases.find(c => c.receiptNumber === receiptNumber);
    if (!caseData) return;
    
    if (confirm(`Are you sure you want to delete case **${receiptNumber}**?`)) {
        cases = cases.filter(c => c.receiptNumber !== receiptNumber);
        saveCasesToStorage();
        renderCasesList();
        showNotification('Case deleted successfully!', 'success');
    }
}

// Clear all data
function clearAllData() {
    if (confirm('Are you sure you want to clear all case data? This cannot be undone.')) {
        cases = [];
        saveCasesToStorage();
        renderCasesList();
        showNotification('All data cleared successfully!', 'success');
    }
}

// Export data
function exportData() {
    if (cases.length === 0) {
        showNotification('No data to export!', 'error');
        return;
    }
    
    const exportData = {
        cases: cases,
        exportedAt: new Date().toISOString(),
        version: '5.0-refined'
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `uscis-case-tracker-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    
    showNotification('Data exported successfully!', 'success');
}

// Get status class
function getStatusClass(actionCode) {
    const statusClasses = {
        'IAF': 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border border-gray-300',
        'BIO': 'bg-gradient-to-r from-blue-100 to-blue-200 text-blue-700 border border-blue-300',
        'RFE': 'bg-gradient-to-r from-red-100 to-red-200 text-red-700 border border-red-300',
        'INT': 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-700 border border-orange-300',
        'APP': 'bg-gradient-to-r from-green-100 to-green-200 text-green-700 border border-green-300',
        'DEN': 'bg-gradient-to-r from-red-100 to-red-200 text-red-700 border border-red-300',
    };
    return statusClasses[actionCode] || 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border border-gray-300';
}

// Format date
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    // Always use CST timezone for consistent display
    return date.toLocaleDateString('en-US', { 
        timeZone: 'America/Chicago',
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

// Format date time
function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    // Always use CST timezone for consistent display
    return date.toLocaleString('en-US', { 
        timeZone: 'America/Chicago',
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }) + ' CST';
}

// Show notification
function showNotification(message, type = 'info') {
    const container = document.getElementById('notificationContainer');
    if (!container) return;
    
    const notification = document.createElement('div');
    const bgColors = {
        'success': 'bg-gradient-to-r from-green-500 to-green-600',
        'error': 'bg-gradient-to-r from-red-500 to-red-600',
        'info': 'bg-gradient-to-r from-blue-500 to-blue-600'
    };
    
    const icons = {
        'success': 'fa-check-circle',
        'error': 'fa-exclamation-circle',
        'info': 'fa-info-circle'
    };
    
    notification.className = `px-4 py-3 rounded-lg shadow-xl fade-in ${bgColors[type]} text-white border border-white border-opacity-20 transform transition-all duration-300`;
    notification.innerHTML = `
        <div class="flex items-center text-sm">
            <div class="w-5 h-5 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-2">
                <i class="fas ${icons[type]} text-xs"></i>
            </div>
            <span class="font-medium">${message}</span>
        </div>
    `;
    
    container.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
        notification.style.opacity = '1';
    }, 10);
    
    // Remove after 3 seconds with fade out
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}




