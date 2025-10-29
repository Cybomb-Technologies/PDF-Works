import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Merge, Minimize2, FileType, Edit3, Eye, Lock, Star, Cpu
} from 'lucide-react';
 
const HomePage = () => {
  const features = [
    { name: 'Merge & Split', icon: Merge, description: 'Combine or extract PDF pages effortlessly.' },
    { name: 'Compress', icon: Minimize2, description: 'Reduce file size while maintaining quality.' },
    { name: 'Convert', icon: FileType, description: 'Switch between PDF and other formats like Word, JPG.' },
    { name: 'Edit & Sign', icon: Edit3, description: 'Add text, images, and legally binding signatures.' },
    { name: 'OCR', icon: Eye, description: 'Turn scanned documents into searchable text.' },
    { name: 'Protect', icon: Lock, description: 'Secure your files with passwords and permissions.' },
  ];
 
  const testimonials = [
    { name: 'Sarah J.', role: 'Marketing Manager', text: 'PDF Pro has become an indispensable tool for our team. The batch processing feature saves us hours of work every week!', avatar: 'https://i.pravatar.cc/150?img=1' },
    { name: 'Mike R.', role: 'Freelance Designer', text: 'The conversion quality is top-notch, especially from PDF to image formats. It\'s fast, reliable, and the UI is a joy to use.', avatar: 'https://i.pravatar.cc/150?img=2' },
    { name: 'Dr. Emily Carter', role: 'University Researcher', text: 'I handle hundreds of research papers. The OCR and annotation tools are a lifesaver for my work. Highly recommended!', avatar: 'https://i.pravatar.cc/150?img=3' },
  ];
const logos = [
    "https://res.cloudinary.com/duomzq5mm/image/upload/v1761200939/microsoft-5_z1f1q9.svg",
    "https://res.cloudinary.com/duomzq5mm/image/upload/v1761201009/Zoho-logo_ggtqnk.png",
    "https://res.cloudinary.com/duomzq5mm/image/upload/v1761201062/aws-2_whii9k.svg",
    "https://res.cloudinary.com/duomzq5mm/image/upload/v1761201134/djit-trading-DY90WfDK_kbwf1d.png",
    "https://res.cloudinary.com/dcfjt8shw/image/upload/c_crop,ar_4:3/v1761221135/klmewbshocakvtcys6iv.png",
    "https://res.cloudinary.com/duomzq5mm/image/upload/v1761220634/cybomb_logo_cf2edt.jpg",
    "https://res.cloudinary.com/dcfjt8shw/image/upload/v1761297491/j4q6qjzlm93uirax0l6f.png",
  ];
 
  return (
    <div className="space-y-24 md:space-y-32 overflow-hidden">
      {/* Hero Section */}
      <section className="relative text-center pt-16">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 2 }}
          className="absolute inset-0 -z-10 animate-aurora aurora-bg"
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 bg-secondary/80 border border-primary/20 rounded-full px-4 py-1 mb-6">
            <Cpu className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-primary">AI-Powered Document Intelligence</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
            The Future of <span className="gradient-text">PDF Editing</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground">
            Effortlessly edit, convert, merge, sign, and secure your PDF documents with our intelligent, AI-enhanced toolkit.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link to="/tools">
              <Button size="lg" className="bg-primary text-primary-foreground text-lg hover:bg-primary/90 shadow-lg shadow-primary/20">
                Get Started for Free
              </Button>
            </Link>
            <Link to="/pricing">
              <Button size="lg" variant="outline" className="text-lg">
                View Pricing
              </Button>
            </Link>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, delay: 0.3, type: 'spring' }}
          className="mt-16 max-w-5xl mx-auto"
        >
          <div className="glass-effect rounded-2xl p-2">
            <img class="rounded-xl shadow-2xl shadow-black/20"
             alt="Screenshot of the pdfworks application dashboard showing various tools and a clean user interface"
              src="/pdf-works.jpg" />
          </div>
        </motion.div>
      </section>
 
      {/* Features Section */}
      <section className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold">Powerful Tools for Every Task</h2>
          <p className="mt-4 text-lg text-muted-foreground">From simple edits to complex workflows, we've got you covered.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="glass-effect rounded-2xl p-6 text-center hover-lift"
            >
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-secondary flex items-center justify-center mx-auto mb-4">
                <feature.icon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.name}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>
 
      {/* Testimonials Section */}
      <section className="bg-secondary/30 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold">Loved by Professionals Worldwide</h2>
            <p className="mt-4 text-lg text-muted-foreground">Don't just take our word for it. Here's what our users say.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="glass-effect rounded-2xl p-6 flex flex-col"
              >
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />)}
                </div>
                <p className="text-foreground/80 flex-grow">"{testimonial.text}"</p>
                <div className="flex items-center mt-6">
                  <img className="w-12 h-12 rounded-full mr-4" alt={`Avatar of ${testimonial.name}`} src="https://images.unsplash.com/photo-1543743763-c36e879cf280" />
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
     <section className="py-20 bg-gray-50">
      <style>{`
        .partnership-heading {
          text-align: center;
          font-size: 2.5rem;
          font-weight: 800;
          font-family: 'Poppins', sans-serif;
          background: linear-gradient(to right, #9333EA, #DB2777);
          -webkit-background-clip: text;
          color: transparent;
          display: inline-block;
          position: relative;
          margin: 0 auto 40px auto;
        }
        .underline {
          position: absolute;
          bottom: -10px;
          left: 50%;
          transform: translateX(-50%);
          width: 70px;
          height: 5px;
          border-radius: 10px;
          background: linear-gradient(to right, #9333EA, #DB2777);
        }
        .carousel {
          display: flex;
          overflow: hidden;
        }
        .carousel-track {
          display: flex;
          animation: scroll 15s linear infinite;
        }
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .partner-card {
          flex: 0 0 auto;
          background: white;
          border-radius: 10px;
          padding: 20px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          width: 180px;
          margin-right: 1rem;
          margin-top: 10px;
          margin-bottom: 10px;
        }
        .partner-card img {
          width: 100px;
          height: auto;
          object-fit: contain;
        }
      `}</style>
 
      {/* Centered Heading */}
      <div className="text-center">
        <h2 className="partnership-heading">
          Our Partners
          <div className="underline"></div>
        </h2>
      </div>
 
      {/* Carousel */}
      <div className="container mx-auto">
        <div className="carousel">
          <div className="carousel-track">
            {[...logos, ...logos].map((logo, index) => (
              <div key={index} className="partner-card">
                <img src={logo} alt={`Partner ${index + 1}`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
      {/* CTA Section */}
      <section className="text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold gradient-text">Ready to Supercharge Your PDFs?</h2>
          <p className="mt-4 text-xl text-muted-foreground">
            Join thousands of users who trust pdfworks for their document needs. Sign up for free and experience the difference.
          </p>
          <div className="mt-8">
            <Link to="/tools">
              <Button size="lg" className="bg-primary text-primary-foreground text-lg hover:bg-primary/90 shadow-lg shadow-primary/20">
                Explore All Tools
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
 
export default HomePage;
 