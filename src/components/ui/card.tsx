import * as React from "react"

const Card = ({ className, children, ...props }: any) => (
  <div className={className} {...props}>{children}</div>
);

const CardHeader = ({ className, children, ...props }: any) => (
  <div className={className} {...props}>{children}</div>
);

const CardContent = ({ className, children, ...props }: any) => (
  <div className={className} {...props}>{children}</div>
);

const CardFooter = ({ className, children, ...props }: any) => (
  <div className={className} {...props}>{children}</div>
);

const CardDescription = ({ className, children, ...props }: any) => (
  <p className={className} {...props}>{children}</p>
);

const CardTitle = ({ className, children, ...props }: any) => (
  <h2 className={className} {...props}>{children}</h2>
);

export { Card, CardHeader, CardContent, CardFooter, CardDescription, CardTitle };