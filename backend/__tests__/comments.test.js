const httpMocks = require('node-mocks-http');
const commentController = require('../src/controllers/commentController');
const Comment = require('../src/models/Comment');

jest.mock('../src/models/Comment');

describe('Editorial Comments System', () => {
  let req, res;

  beforeEach(() => {
    req = httpMocks.createRequest();
    res = httpMocks.createResponse();
  });

  it('CMT-01: should add a valid context-bound comment to the database', async () => {
    req.body = {
      document_id: 101,
      selected_text: "He looked at the dark sky.",
      quote_match_index: 0,
      content: "Consider adding more descriptive weather details here.",
      status: "open"
    };
    req.user = { username: "Editor Jane" };

    Comment.create.mockResolvedValue({ comment_id: 1, ...req.body });

    await commentController.addComment(req, res);

    expect(res.statusCode).toBe(201);
    
    expect(Comment.create).toHaveBeenCalledWith(expect.objectContaining({
      selected_text: "He looked at the dark sky."
    }));
  });

  it('CMT-02: should return 400 Bad Request when missing required parameters', async () => {
    
    req.body = {
      content: "This comment is floating in the void without context."
    };

    await commentController.addComment(req, res);

    
    expect(res.statusCode).toBe(400);
  });

  it('CMT-03: should successfully update comment status to resolved', async () => {
    req.params = { id: 1 };
    req.body = { status: 'resolved' };

    const mockComment = { 
      comment_id: 1, 
      status: 'open',
      save: jest.fn().mockResolvedValue(true)
    };
    Comment.findByPk.mockResolvedValue(mockComment);

    await commentController.updateComment(req, res);

    expect(mockComment.status).toBe('resolved');
    expect(mockComment.save).toHaveBeenCalled();
  });
});