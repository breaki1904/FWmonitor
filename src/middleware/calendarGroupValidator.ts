'use strict';

import { body } from 'express-validator';

export const update = [
    body('name').exists().withMessage('name is required').escape().trim(),
    body('pattern').exists().withMessage('pattern is required').escape().trim()
];
