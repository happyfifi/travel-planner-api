// Function for sending response
function sendResponse(res, statusCode, message, data = {}) {
    console.log('Sending response:', { statusCode, message, data });
    const response = {
        status: statusCode >=200 && statusCode < 300 ? 'success' : 'error',
        message,
        ...data
    };

    console.log('Final response:', response);
    return res.status(statusCode).json(response);
}

module.exports = { sendResponse };
    
