// Validation functions (Phone Number)

function isValidMalaysianPhoneNumber(phoneNumber) {
    // Remove any non-digit characters
    const cleanedNumber = phoneNumber.replace(/\D/g, '');
 
    // Check if the number starts with '60' (country code for Malaysia)
    const startsWithCountryCode = cleanedNumber.startsWith('60');
 
    // Define the patterns
    const patterns = [
        /^(?:60|0)1[0-46-9][0-9]{7,8}$/, // Mobile numbers
        /^(?:60|0)1[1-9][0-9]{8}$/,     // Mobile numbers (newer ranges)
        /^(?:60|0)[2-9][0-9]{7,8}$/     // Landline numbers
    ];
 
    // If the number starts with the country code, we'll check it as is
    // If not, we'll check both with and without a leading '0'
    return patterns.some(pattern => 
        pattern.test(cleanedNumber) || 
        (!startsWithCountryCode && pattern.test('0' + cleanedNumber))
    );
}

function formatMalaysianPhoneNumber(phoneNumber) {

    // Remove any non-digit characters
    const cleanedNumber = phoneNumber.replace(/\D/g, '');
 

    // If the number starts with '60', remove it
    const withoutCountryCode = cleanedNumber.startsWith('60') 
        ? cleanedNumber.slice(2) 
        : cleanedNumber;
 
    // Add a leading '0' if it's not there
    const normalizedNumber = withoutCountryCode.startsWith('0') 
        ? withoutCountryCode 
        : '0' + withoutCountryCode;
 


    // Format the number

    if (normalizedNumber.length === 10) {
        return `${normalizedNumber.slice(0, 3)}-${normalizedNumber.slice(3, 6)}-${normalizedNumber.slice(6)}`;
    } else if (normalizedNumber.length === 11) {
        return `${normalizedNumber.slice(0, 3)}-${normalizedNumber.slice(3, 7)}-${normalizedNumber.slice(7)}`;
    } else {

        // If the number doesn't fit the expected format, return it as is

        return normalizedNumber;

    }

}
 

// Validation Email

const isValidEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

module.exports = {
    isValidMalaysianPhoneNumber,
    formatMalaysianPhoneNumber,
    isValidEmail
};