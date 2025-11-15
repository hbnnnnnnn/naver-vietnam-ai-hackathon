import React from "react";
import Image from "../../../components/AppImage";
import Icon from "../../../components/AppIcon";

const TeamShowcase = () => {
  const teamMembers = [
    {
      id: 1,
      name: "Trần Cẩm Huy",
      role: "Developer",
      description: "Third year student at HCMUS.",
      avatar:
        "https://i.pinimg.com/736x/7c/aa/01/7caa01ab379ba99e72a7a22713603fe5.jpg",
      expertise: ["Data Science"],
      social: {
        github: "https://github.com/huytran28",
      },
    },
    {
      id: 2,
      name: "Hà Bảo Ngọc",
      role: "Developer",
      description: "Third year student at HCMUS",
      avatar:
        "https://i.pinimg.com/736x/7c/aa/01/7caa01ab379ba99e72a7a22713603fe5.jpg",
      expertise: ["Software Engineering"],
      social: {
        github: "https://github.com/hbnnnnnnn",
      },
    },
    {
      id: 3,
      name: "Huỳnh Yến Nhi",
      role: "Developer",
      description: "Third year student at HCMUS",
      avatar:
        "https://i.pinimg.com/736x/7c/aa/01/7caa01ab379ba99e72a7a22713603fe5.jpg",
      expertise: ["Data Science"],
      social: {
        github: "https://github.com/ynnhi2607",
      },
    },
    {
      id: 4,
      name: "Nguyễn Đoàn Xuân Thu",
      role: "Developer",
      description: "Third year student at HCMUS",
      avatar:
        "https://i.pinimg.com/736x/7c/aa/01/7caa01ab379ba99e72a7a22713603fe5.jpg",
      expertise: ["Software Engineering"],
      social: {
        github: "https://github.com/thu2005",
      },
    },
  ];

  const getSocialIcon = (platform) => {
    const icons = {
      github: "Github",
    };
    return icons?.[platform] || "Link";
  };

  return (
    <section className="py-15 bg-gradient-to-b from-gray-50/50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-heading font-bold mb-6">
            <span className="gradient-text">Our Development Team</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-caption">
            Meet the experts behind our intelligent skincare analysis technology
          </p>
        </div>

        {/* Team Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {teamMembers?.map((member, index) => (
            <div
              key={member?.id}
              className="group glass-card p-4 rounded-2xl shadow-glass hover:shadow-glass-lg transition-all duration-300 animate-glass-float text-center"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Avatar */}
              <div className="relative mb-6">
                <div className="w-24 h-24 mx-auto rounded-full overflow-hidden ring-4 ring-white/20 group-hover:ring-primary/30 transition-all duration-300">
                  <Image
                    src={member?.avatar}
                    alt={member?.avatarAlt}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                </div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-gradient-primary rounded-full flex items-center justify-center">
                  <Icon name="Check" size={14} color="white" />
                </div>
              </div>

              {/* Member Info */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-heading font-semibold text-foreground mb-1">
                    {member?.name}
                  </h3>
                  <p className="text-primary font-medium font-caption">
                    {member?.role}
                  </p>
                </div>

                <p className="text-sm text-muted-foreground font-caption leading-relaxed">
                  {member?.description}
                </p>

                {/* Expertise Tags */}
                <div className="flex flex-wrap gap-2 justify-center">
                  {member?.expertise?.map((skill, skillIndex) => (
                    <span
                      key={skillIndex}
                      className="px-3 py-1 bg-white/50 text-xs text-muted-foreground rounded-full border border-white/20 font-caption"
                    >
                      {skill}
                    </span>
                  ))}
                </div>

                {/* Social Links */}
                <div className="flex justify-center gap-3 pt-2">
                  {Object.entries(member?.social)?.map(([platform, url]) => (
                    <a
                      key={platform}
                      href={url}
                      className="w-8 h-8 bg-white/20 hover:bg-primary hover:text-white rounded-full flex items-center justify-center transition-all duration-300 group/social"
                      aria-label={`${member?.name} ${platform} profile`}
                    >
                      <Icon
                        name={getSocialIcon(platform)}
                        size={16}
                        className="group-hover/social:scale-110 transition-transform duration-200"
                      />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TeamShowcase;
