import express from 'express';
import { contactUsController } from './contactus.controller';


const router = express.Router();

router.post('/send-email', contactUsController.sendEmailFromContactUs);

export const contactUsRoutes = router;
