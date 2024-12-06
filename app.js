new Vue({
    el: '#app',
    data() {
        return {
            sitename: 'After School App',
            showLessons: true, // Toggle between lessons and checkout
            lessons: [], // Initialize lessons array
            order: {
                firstName: '',
                lastName: '',
                address: '',
                city: '',
                zip: '',
                state: '',
                type: '' // New property for order type
            },
            cart: [], // Array to hold cart items
            sortOption: 'title', // Default sort option
            
            searchQuery: '', // Search query
            isLoading: false, // Loading state
            query: "", // User's search input
            results: [], // Results fetched from the Back-End
            states: [ // List of states for dropdown
                'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California',
                'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia',
                'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
                'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
                'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee',
                'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
                'West Virginia', 'Wisconsin', 'Wyoming'
            ]
        };
    },
    computed: {
        cartItemCount() {
            return this.cart.reduce((total, item) => total + item.quantity, 0);
        },
    },
    methods: {
        remainingStock(lessonId) {
            const lesson = this.lessons.find(lesson => lesson.id === lessonId);
            if (!lesson) return 0;
            return lesson.availableInventory - this.cartCount(lessonId);
        },

        canAddToCart(lesson) {
            return lesson.availableInventory > this.cartCount(lesson.id); // Check if item can be added
        },
        cartCount(lessonId) {
            const item = this.cart.find(item => item.id === lessonId);
            return item ? item.quantity : 0; // Return the count of the item in the cart or 0
        },
    
        setSortOption(option) {
            this.sortOption = option; // Set the sorting option
        },
    
        // Add to Cart Method
    addToCart(lesson) {
        if (lesson.availableInventory > 0) {
            const existingItem = this.cart.find(item => item.id === lesson.id);

            if (existingItem) {
                existingItem.quantity++; // Increment quantity if item already exists in cart
            } else {
                this.cart.push({ id: lesson.id, quantity: 1 }); // Add new item to cart
            }

            lesson.availableInventory--; // Decrease available inventory
        } else {
            alert("Cannot add more items to the cart. Out of stock!");
        }
    },
    
        updateInventory(lessonId, change) {
            // Update the inventory for a specific lesson
            const lesson = this.lessons.find(item => item.id === lessonId);
            if (lesson) {
                lesson.availableInventory += change; // Increment or decrement inventory
            }
        },
        
        toggleCheckout() {
            this.showLessons = !this.showLessons;
        },
        sortLessons() {
            const sorted = [...this.lessons]; // Create a copy of the lessons array
            if (this.sortOption === 'price') {
              this.lessons = sorted.sort((a, b) => (a.price || 0) - (b.price || 0)); // Sort by price ascending
            } else if (this.sortOption === 'price_desc') {
              this.lessons = sorted.sort((a, b) => (b.price || 0) - (a.price || 0)); // Sort by price descending
            } else if (this.sortOption === 'title') {
              this.lessons = sorted.sort((a, b) => a.title.localeCompare(b.title)); // Sort by title A-Z
            } else if (this.sortOption === 'title_desc') {
              this.lessons = sorted.sort((a, b) => b.title.localeCompare(a.title)); // Sort by title Z-A
            } else if (this.sortOption === 'location') {
              this.lessons = sorted.sort((a, b) => a.location.localeCompare(b.location)); // Sort by location
            } else if (this.sortOption === 'availability') {
              this.lessons = sorted.sort((a, b) => (a.availableInventory || 0) - (b.availableInventory || 0)); // Sort by availability
            }
          },
        
        // Fetch search results from the Back-End
                async searchLessons() {
                    if (!this.query.trim()) {
                    this.results = []; // Clear results if the query is empty
                    return;
                    }

                    try {
                    // Send fetch request to the Back-End
                    const response = await fetch(`http://localhost:3000/search?q=${encodeURIComponent(this.query)}`);

                    const data = await response.json();

                    // Update results with the filtered data
                    this.results = data.results;
                    } catch (error) {
                    console.error("Error fetching search results:", error);
                    }
                },

        
        async submitOrder() {
            // Validate all input fields
            if (!this.order.firstName || !this.order.lastName || !this.order.address ||
                !this.order.city || !this.order.zip || !this.order.state || !this.order.type) {
                alert("Please fill out all required fields before submitting the order.");
                return;
            }

            // Check if the ZIP code is numerical
            if (!/^\d{5}(-\d{4})?$/.test(this.order.zip)) {
                alert("Please enter a valid ZIP code (5 digits or 5+4 format).");
                return;
            }

            // Validate state selection
            if (!this.states.includes(this.order.state)) {
                alert("Please select a valid state.");
                return;
            }

            // Ensure the cart is not empty
            if (!this.cart.length) {
                alert("Your cart is empty. Add an item before placing an order.");
                return;
            }

            // Prepare the order data
            const orderData = {
                lessons: this.cart.map(item => ({
                    lessonId: item._id || item.id, // Use MongoDB ObjectId if available
                    quantity: item.quantity,
                })),
                customerDetails: {
                    firstName: this.order.firstName,
                    lastName: this.order.lastName,
                    address: this.order.address,
                    city: this.order.city,
                    zip: this.order.zip,
                    state: this.order.state,
                    type: this.order.type,
                },
            };

            this.isLoading = true;
            try {
                // Send the order data to the backend API
                const orderResponse = await fetch('http://localhost:3000/collection/orders', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(orderData),
                });

                if (!orderResponse.ok) {
                    const errorText = await orderResponse.text();
                    const errorMessage = this.parseErrorMessage(errorText, 'Failed to place the order.');
                    throw new Error(errorMessage);
                }

                const orderResult = await orderResponse.json();
                console.log('Order placed successfully:', orderResult);

        // Update inventory for each lesson in the cart
                for (const item of this.cart) {
                    const lessonId = item._id || item.id;

                    const inventoryResponse = await fetch(`http://localhost:3000/collection/lessons/${lessonId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ availableInventory: item.availableInventory }),
                    });

                    if (!inventoryResponse.ok) {
                        const errorText = await inventoryResponse.text();
                        const errorMessage = this.parseErrorMessage(
                            errorText,
                            `Failed to update inventory for lesson ${lessonId}.`
                        );
                        throw new Error(errorMessage);
                    }

                    const inventoryResult = await inventoryResponse.json();
                    console.log(`Inventory updated for lesson ${lessonId}:`, inventoryResult);
                }

                // Clear the order form fields and cart
                this.order = {
                    firstName: '',
                    lastName: '',
                    address: '',
                    city: '',
                    zip: '',
                    state: '',
                    type: '',
                };
                this.cart = [];
                this.showLessons = true;

                // Show success message
                alert(orderResult.message || 'Order placed successfully!');

            } catch (error) {
                console.error('Error submitting order:', error);
                alert(error.message || 'Failed to place the order. Please try again later.');
            } finally {
                this.isLoading = false;
            }
        },

        parseErrorMessage(responseText, defaultMessage) {
            try {
                const errorData = JSON.parse(responseText);
                return errorData.message || defaultMessage;
            } catch {
                return responseText || defaultMessage;
            }
        },

        
        async fetchLessons() {
            console.log('Requesting data from server...');
            this.isLoading = true;

            try {
                const response = await fetch('http://localhost:3000/collection/lessons');
                if (!response.ok) {
                    throw new Error('Failed to fetch lessons. Server returned an error.');
                }
                const data = await response.json();
                if (!Array.isArray(data)) {
                    throw new Error('Unexpected response format. Expected an array.');
                }
                this.lessons = data;
                console.log('Lessons fetched:', data);
            } catch (error) { 
                console.error('Error fetching lessons:', error);
                alert(error.message || 'Failed to load lessons. Please try again later.');
            } finally {
                this.isLoading = false;
            }
        }
    },
    created() {
        this.fetchLessons();
    }
});
