const domainHandler = (req, res, next) => {
  const allowedDomains = process.env.ALLOWED_DOMAINS ? 
    process.env.ALLOWED_DOMAINS.split(',') : [];
  
  const host = req.get('host');
  const domain = host.split(':')[0]; // Remove port if present
  
  // Allow requests from allowed domains
  if (allowedDomains.includes(domain)) {
    // Store the current domain in the request object for later use
    req.currentDomain = domain;
    next();
  } else {
    // If no domains are configured, allow all requests
    if (allowedDomains.length === 0) {
      req.currentDomain = domain;
      next();
    } else {
      res.status(403).json({ 
        message: 'Access denied: Domain not allowed',
        allowedDomains: allowedDomains
      });
    }
  }
};

module.exports = domainHandler; 