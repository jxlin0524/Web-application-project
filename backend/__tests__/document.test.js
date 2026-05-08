const httpMocks = require('node-mocks-http');
const documentController = require('../src/controllers/documentController');
const Document = require('../src/models/Document'); 

jest.mock('../src/models/Document');

describe('Document State & AI Cache Invalidation', () => {
  let req, res;

  beforeEach(() => {
    req = httpMocks.createRequest();
    res = httpMocks.createResponse();
  });

  it('DOC-01: should auto-calculate display order when not provided', async () => {
    req.body = { title: 'Chapter 3', project_id: 1 };
    
   
    Document.max.mockResolvedValue(2);
    Document.create.mockResolvedValue({ id: 3, display_order: 3 });

    await documentController.createDocument(req, res);

    expect(res.statusCode).toBe(201);
    expect(Document.max).toHaveBeenCalled();
  });

  it('CACHE-01: should set ai_summary to NULL on text content edit', async () => {
    req.params = { id: 1 };
    req.body = { content: 'New text edited by author' }; 
    
    
    const mockDocument = { 
      id: 1, 
      content: 'Old text', 
      ai_summary: 'Cached summary',
      save: jest.fn().mockResolvedValue(true)
    };
    Document.findByPk.mockResolvedValue(mockDocument);

    await documentController.updateDocument(req, res);

    
    expect(mockDocument.ai_summary).toBeNull();
    expect(mockDocument.save).toHaveBeenCalled();
  });

  it('CACHE-02: should preserve ai_summary when only title is edited', async () => {
    req.params = { id: 1 };
    req.body = { title: 'New Title' }; 
    
    const mockDocument = { 
      id: 1, 
      title: 'Old Title', 
      content: 'Text', 
      ai_summary: 'Cached summary',
      save: jest.fn().mockResolvedValue(true)
    };
    Document.findByPk.mockResolvedValue(mockDocument);

    await documentController.updateDocument(req, res);

    
    expect(mockDocument.ai_summary).toBe('Cached summary');
  });
});