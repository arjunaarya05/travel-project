const api_key = "AIzaSyCW1q-hXYSoh5pOFYAc0EgSiTGAT2ADpxg";

// Tab switching functionality
document.querySelectorAll('.search-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelector('.search-tab.active').classList.remove('active');
        tab.classList.add('active');
    });
});

// Destination card hover effects
document.querySelectorAll('.destination-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
        card.querySelector('.destination-overlay').style.backgroundColor = 'rgba(76, 175, 80, 0.8)';
    });

    card.addEventListener('mouseleave', () => {
        card.querySelector('.destination-overlay').style.backgroundColor = '';
    });
});

// Gemini API integration with comprehensive error handling
document.querySelector('.search-form').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Gather form data
    const formData = {
        from: document.getElementById('from').value,
        to: document.getElementById('to').value,
        departure: document.getElementById('departure').value,
        returnDate: document.getElementById('return').value,
        placeCategory: document.getElementById('Place-category').value,
        travelers: document.getElementById('travelers').value
    };

    // Validate required fields
    if (!formData.to) {
        alert('Please enter a destination');
        return;
    }

    // Show loading state
    const searchBtn = document.querySelector('.search-form .btn');
    const originalBtnText = searchBtn.innerHTML;
    searchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Planning...';
    searchBtn.disabled = true;

    // Show loading indicator
    showLoadingIndicator();

    try {
        // Generate prompt
        const prompt = generatePrompt(formData);
        console.log('Generated Prompt:', prompt); // Debug log

        // Call Gemini API
        const itinerary = await callGeminiAPI(prompt);
        
        // Display results
        displayItinerary(itinerary);
        
    } catch (error) {
        console.error('Full error details:', error);
        showError(error);
    } finally {
        // Reset button state
        searchBtn.innerHTML = originalBtnText;
        searchBtn.disabled = false;
        hideLoadingIndicator();
    }
});

// Generate the prompt for Gemini
function generatePrompt(formData) {
    return `Act as a professional travel planner with 20 years of experience. Create a detailed ${formData.placeCategory.toLowerCase()} itinerary for a trip from ${formData.from || 'your location'} to ${formData.to}.

Travel Details:
- Travelers: ${formData.travelers}
- Dates: ${formData.departure} to ${formData.returnDate}
- Interests: ${formData.placeCategory}

Itinerary Requirements:
1. Create a day-by-day schedule with time allocations
2. Include must-see attractions with brief descriptions
3. Recommend local restaurants with cuisine types
4. Add transportation tips between locations
5. Include budget estimates for each day
6. Provide cultural tips or etiquette notes
7. Add safety recommendations where relevant

Format the response in clear sections with markdown formatting for readability.`;
}

// Call Gemini API with proper error handling
async function callGeminiAPI(prompt) {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${api_key}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                safetySettings: {
                    category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                    threshold: "BLOCK_ONLY_HIGH"
                },
                generationConfig: {
                    temperature: 0.7,
                    topP: 0.9,
                    topK: 40,
                    maxOutputTokens: 2048
                }
            })
        });

        // Check for HTTP errors
        if (!response.ok) {
            const errorData = await response.json();
            console.error('API Error Response:', errorData);
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log('API Response:', data); // Debug log

        // Validate response structure
        if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
            throw new Error('Unexpected API response structure');
        }

        return data.candidates[0].content.parts[0].text;

    } catch (error) {
        console.error('API Call Failed:', error);
        throw new Error(`Failed to generate itinerary: ${error.message}`);
    }
}

// Display itinerary in the UI
function displayItinerary(itinerary) {
    // Create or find itinerary display section
    let itinerarySection = document.querySelector('.itinerary-results');
    
    if (!itinerarySection) {
        itinerarySection = document.createElement('div');
        itinerarySection.className = 'itinerary-results';
        
        // Insert after search box
        const searchBox = document.querySelector('.search-box');
        searchBox.parentNode.insertBefore(itinerarySection, searchBox.nextSibling);
    }
    
    // Convert markdown-like formatting to HTML
    const formattedItinerary = formatItineraryText(itinerary);
    
    // Display the itinerary
    itinerarySection.innerHTML = `
        <div class="itinerary-container">
            <div class="itinerary-header">
                <h2>Your Personalized Travel Itinerary</h2>
                <div class="itinerary-actions">
                    <button class="btn print-btn" onclick="window.print()">
                        <i class="fas fa-print"></i> Print
                    </button>
                    <button class="btn save-btn" onclick="saveItinerary()">
                        <i class="fas fa-save"></i> Save
                    </button>
                </div>
            </div>
            <div class="itinerary-content">${formattedItinerary}</div>
        </div>
    `;
    
    // Scroll to the itinerary
    itinerarySection.scrollIntoView({ behavior: 'smooth' });
}

// Format the itinerary text with basic markdown support
function formatItineraryText(text) {
    // Convert markdown headings to HTML
    text = text.replace(/^#\s(.+)$/gm, '<h3>$1</h3>');
    text = text.replace(/^##\s(.+)$/gm, '<h4>$1</h4>');
    text = text.replace(/^###\s(.+)$/gm, '<h5>$1</h5>');
    
    // Convert bullet points to lists
    text = text.replace(/^\*\s(.+)$/gm, '<li>$1</li>');
    text = text.replace(/(<li>.*<\/li>)+/gms, '<ul>$&</ul>');
    
    // Preserve line breaks
    text = text.replace(/\n/g, '<br>');
    
    // Highlight important notes
    text = text.replace(/Note:/g, '<strong>Note:</strong>');
    text = text.replace(/Tip:/g, '<strong>Tip:</strong>');
    
    return text;
}

// Show loading indicator
function showLoadingIndicator() {
    let loadingDiv = document.querySelector('.loading-indicator');
    if (!loadingDiv) {
        loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading-indicator';
        loadingDiv.innerHTML = `
            <div class="loading-content">
                <i class="fas fa-plane fa-spin"></i>
                <p>Creating your perfect itinerary...</p>
            </div>
        `;
        document.body.appendChild(loadingDiv);
    }
    loadingDiv.style.display = 'flex';
}

// Hide loading indicator
function hideLoadingIndicator() {
    const loadingDiv = document.querySelector('.loading-indicator');
    if (loadingDiv) {
        loadingDiv.style.display = 'none';
    }
}

// Show error message
function showError(error) {
    let errorDiv = document.querySelector('.error-message');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        document.body.appendChild(errorDiv);
    }
    
    errorDiv.innerHTML = `
        <div class="error-content">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Oops! Something went wrong</h3>
            <p>${error.message}</p>
            <button onclick="this.parentElement.parentElement.style.display='none'">
                Close
            </button>
        </div>
    `;
    errorDiv.style.display = 'flex';
}

// Save itinerary to local storage
function saveItinerary() {
    const itineraryContent = document.querySelector('.itinerary-content')?.innerText;
    if (itineraryContent) {
        const savedTrips = JSON.parse(localStorage.getItem('savedTrips') || '[]');
        const tripId = Date.now().toString();
        
        savedTrips.push({
            id: tripId,
            date: new Date().toLocaleString(),
            content: itineraryContent
        });
        
        localStorage.setItem('savedTrips', JSON.stringify(savedTrips));
        alert('Itinerary saved successfully!');
    } else {
        alert('No itinerary to save');
    }
}