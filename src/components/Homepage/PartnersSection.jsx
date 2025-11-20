// src/components/sections/PartnersSection.jsx
import React from 'react';

const PartnersSection = () => {
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

      <div className="text-center">
        <h2 className="partnership-heading">
          Our Partners
          <div className="underline"></div>
        </h2>
      </div>

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
  );
};

export default PartnersSection;