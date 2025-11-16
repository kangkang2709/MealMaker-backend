const swaggerJSDoc = require('swagger-jsdoc');     // <-- phải đều là JSDoc
const swaggerUi = require('swagger-ui-express');
const path = require('path');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'MealMaker API',
            version: '1.0.0',
            description: 'API docs for MealMaker backend',
        },
        servers: [
            {
                url: process.env.BASE_URL_LOCAL,
                description: 'Local server',
            },
            {
                url: process.env.BASE_URL_PROD,
                description: 'Railway production server',
            },
        ],
    },
    apis: [path.resolve(__dirname, '../routes/*.js')], // <-- đúng cú pháp path
};

const swaggerSpec = swaggerJSDoc(options);   // <-- dùng đúng tên biến

module.exports = (app) => {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
};
