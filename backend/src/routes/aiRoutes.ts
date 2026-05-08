import { Router } from 'express';
import { aiController } from '../controllers/aiController';

const router = Router();

/**
 * @route   
 * @desc    
 * @access  
 */

router.post('/generate-timeline', aiController.generateTimeline);

router.post('/polish', aiController.polishText);

router.post('/consult-entry', aiController.consultWorldEntry);

export default router;